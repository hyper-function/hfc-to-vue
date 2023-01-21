import type IVue from "vue";
import { onBeforeUpdate, watch } from "vue";

interface TeleportItem {
  key: string;
  container: Element;
  args: Record<string, any>;
  slotFn: IVue.Slot;
}

export default function (Vue: typeof IVue) {
  const {
    h,
    ref,
    toRaw,
    inject,
    provide,
    isProxy,
    reactive,
    Teleport,
    onMounted,
    onBeforeUnmount,
    defineComponent,
  } = Vue;

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

    const RenderTeleports = defineComponent(() => {
      const teleports = inject<TeleportItem[]>("teleports", []);
      return () =>
        teleports.map((item) =>
          h(
            Teleport,
            { to: item.container, key: item.key },
            item.slotFn(item.args)
          )
        );
    });

    return defineComponent({
      inheritAttrs: false,
      setup(__, ctx) {
        const container = ref<HTMLElement>();

        const teleports = reactive<TeleportItem[]>([]);
        provide("teleports", teleports);

        let attrs: Record<string, any> = {};
        let events: Record<string, any> = {};
        let slots: Record<string, any> = {};
        let _: Record<string, any> = {};

        let hfc = ref<ReturnType<HyperFunctionComponent>>();
        const forceUpdate = ref(0);

        ctx.expose({
          container,
          hfc,
          HFC,
        });

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

        function parseSlots() {
          slots = {};
          for (let slotKey in ctx.slots) {
            const slotName = slotNameMap.get(slotKey);
            if (!slotName) continue;

            const slot = ctx.slots[slotKey]!;
            slots[slotName] = function (container: Element, args?: any) {
              args = args || {};
              const slotKey = args.key || slotName;
              const teleport = {
                key: slotKey,
                args,
                container,
                slotFn: slot,
              };

              const index = teleports.findIndex((item) => item.key === slotKey);

              index === -1
                ? teleports.push(teleport)
                : (teleports[index] = teleport);
            };
          }
        }

        parseAttrs();
        parseSlots();

        onMounted(() => {
          hfc.value = HFC(container.value!, { attrs, events, slots, _ });
          container.value!.setAttribute("hfc", HFC.hfc);
          (container.value as any).hfc = hfc.value;
          (container.value as any).HFC = HFC;
        });

        onBeforeUnmount(() => {
          hfc.value!.disconnected();
        });

        onBeforeUpdate(() => {
          parseAttrs();
          parseSlots();

          hfc.value?.changed({ attrs, events, slots, _ });
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
          return [h(HFC.tag, { ref: container, ..._ }), h(RenderTeleports)];
        };
      },
    });
  };
}
