import type IVue from "vue";
import type {
  HyperFunctionComponent,
  HfcSlotCallback,
  HfcSlotOptions,
} from "hyper-function-component";

let uuid = 0;
type SlotTeleports = Map<
  HfcSlotOptions,
  {
    key: string;
    name: string;
    slotFn: IVue.Slot;
  }
>;

export default function (Vue: typeof IVue) {
  const {
    h,
    ref,
    toRaw,
    watch,
    inject,
    provide,
    isProxy,
    reactive,
    Teleport,
    onMounted,
    onBeforeUpdate,
    onBeforeUnmount,
    defineComponent,
  } = Vue;

  const TeleportRender = defineComponent(() => {
    const teleports = inject<SlotTeleports>("teleports", new Map());
    return () => {
      return Array.from(teleports).map(([{ target, args }, { slotFn, key }]) =>
        h(Teleport, { to: target, key }, slotFn(args))
      );
    };
  });

  return function hfcToVue(HFC: HyperFunctionComponent) {
    const attrNames = HFC.names[0];
    const eventNames = HFC.names[1];
    const slotNames = HFC.names[2];

    const attrNameMap: Map<string, string> = new Map();
    for (let i = 0; i < attrNames.length; i++) {
      const name = attrNames[i];
      attrNameMap.set(name, name);
      attrNameMap.set(name.toLowerCase(), name);
      attrNameMap.set(name.replace(/[A-Z]/g, "-$&").toLowerCase(), name);
    }

    const eventNameMap: Map<string, string> = new Map();
    for (let i = 0; i < eventNames.length; i++) {
      const name = eventNames[i];
      const firstChar = name[0].toUpperCase();
      const restChar = name.slice(1);

      eventNameMap.set("on" + firstChar + restChar, name);
      eventNameMap.set("on" + firstChar + restChar.toLowerCase(), name);
    }

    const slotNameMap: Map<string, string> = new Map();
    for (let i = 0; i < slotNames.length; i++) {
      const name = slotNames[i];
      slotNameMap.set(name, name);
      slotNameMap.set(name.toLowerCase(), name);
      slotNameMap.set(name.replace(/[A-Z]/g, "-$&").toLowerCase(), name);
    }

    return defineComponent({
      inheritAttrs: false,
      setup(__, ctx) {
        const container = ref<HTMLElement>();

        const teleports = reactive<SlotTeleports>(new Map());
        provide("teleports", teleports);

        let attrs: Record<string, any> = {};
        let events: Record<string, any> = {};
        let slots: Record<string, any> = {};
        let _: Record<string, any> = {};

        const forceUpdate = ref(0);

        function parseAttrs() {
          attrs = {};
          events = {};
          _ = {};
          for (let key in ctx.attrs) {
            const val = ctx.attrs[key];
            const attrName = attrNameMap.get(key);
            if (attrName) {
              attrs[attrName] = isProxy(val) ? toRaw(val) : val;
              continue;
            }

            const eventName = eventNameMap.get(key);
            if (eventName) {
              events[eventName] = val;
              continue;
            }

            _[key] = val;
          }
        }

        // slot cache not work, every time render will create new slot
        // const slotCache = new Map<
        //   string,
        //   {
        //     origin: IVue.Slot;
        //     transformed: HfcSlotCallback;
        //   }
        // >();

        function parseSlots() {
          slots = {};
          for (let slotKey in ctx.slots) {
            const hfcSlotName = slotNameMap.get(slotKey);
            if (!hfcSlotName) continue;

            const slot = ctx.slots[slotKey]!;

            // const cache = slotCache.get(slotKey);
            // if (cache) {
            //   if (cache.origin === slot) {
            //     console.log("slot cached: " + hfcSlotName);
            //     slots[hfcSlotName] = cache.transformed;
            //     continue;
            //   }
            // }

            slots[hfcSlotName] = function (hfcSlot: HfcSlotOptions) {
              let key = "k" + uuid++;

              function renderSlot() {
                teleports.set(hfcSlot, {
                  key,
                  name: hfcSlotName!,
                  slotFn: slot,
                });
              }
              renderSlot();

              hfcSlot.changed = renderSlot;

              hfcSlot.removed = function () {
                teleports.delete(hfcSlot);
              };
            };

            // slotCache.set(slotKey, {
            //   origin: slot,
            //   transformed: slots[hfcSlotName],
            // });
          }
        }

        parseAttrs();
        parseSlots();

        const hfc = HFC({ attrs, events, slots, _ });

        ctx.expose({
          container,
          hfc,
          HFC,
        });

        onMounted(() => {
          container.value!.setAttribute("hfc", HFC.hfc);
          (container.value as any).hfc = hfc;
          (container.value as any).HFC = HFC;
          hfc.connected(container.value!);
        });

        onBeforeUnmount(() => {
          hfc.disconnected();
        });

        onBeforeUpdate(() => {
          parseAttrs();
          parseSlots();

          hfc.changed({ attrs, events, slots, _ });
        });

        if (!ctx.attrs["no-dw"]) {
          watch(
            () => ctx.attrs,
            () => forceUpdate.value++,
            { deep: true }
          );
        }

        return function () {
          forceUpdate.value;
          return [
            h(HFC.tag, { ref: container, ..._ }),
            h(TeleportRender, { key: "hfcSlotRender" }),
          ];
        };
      },
    });
  };
}
