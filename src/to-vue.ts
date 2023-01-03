import type IVue from "vue";

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
    watch,
    toRaw,
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
      setup(_, ctx) {
        const container = ref<HTMLElement>();
        const teleports = reactive<TeleportItem[]>([]);
        provide("teleports", teleports);

        function getHfcAttrsAndEventsFromVueAttrs() {
          const attrs: Record<string, any> = {};
          const events: Record<string, any> = {};
          const _: Record<string, any> = {};

          for (let key in ctx.attrs) {
            const attrName = attrNameMap.get(key);
            if (attrName) {
              let val = ctx.attrs[key];
              if (isProxy(val)) val = toRaw(val);
              attrs[attrName] = val;
              _[key] = val;
              continue;
            }

            const eventName = eventNameMap.get(key);
            if (eventName) {
              const val = ctx.attrs[key];
              events[eventName] = val;
              _[eventName] = val;
              continue;
            }

            let _key = key;
            const val = ctx.attrs[key];
            if (typeof val === "function")
              _key = key[2].toLowerCase() + key.slice(3);

            _[_key] = val;
          }

          return { attrs, events, _ };
        }

        function getHfcSlotsFromVueSlots() {
          const slots: Record<string, any> = {};
          for (let slotKey in ctx.slots) {
            const slotName = slotNameMap.get(slotKey);
            if (!slotName) continue;

            const slot = ctx.slots[slotKey]!;
            slots[slotName] = function (container: Element, args?: any) {
              args = args || {};
              const slotKey = args.key || slotName;
              const teleport = { key: slotKey, args, container, slotFn: slot };

              const index = teleports.findIndex((item) => item.key === slotKey);

              index === -1
                ? teleports.push(teleport)
                : (teleports[index] = teleport);
            };
          }

          return slots;
        }

        function setupCommonAttrs() {
          if (ctx.attrs.id) {
            container.value!.id = ctx.attrs.id as string;
          }

          if (ctx.attrs.class) {
            container.value!.className = ctx.attrs.class as string;
          }

          if (ctx.attrs.style) {
            Object.assign(container.value!.style, ctx.attrs.style);
          }
        }

        let hfc: ReturnType<HyperFunctionComponent>;
        let slots = getHfcSlotsFromVueSlots();
        let prevSlotCount = Object.keys(ctx.slots).length;

        const expose: any = {};
        ctx.expose(expose);

        onMounted(() => {
          const { attrs, events, _ } = getHfcAttrsAndEventsFromVueAttrs();

          container.value!.setAttribute("data-hfc", HFC.hfc);
          setupCommonAttrs();

          hfc = HFC(container.value!, { attrs, events, slots, _ });

          expose.container = container.value;
          expose.hfc = (container.value as any).hfc = {
            name: HFC.hfc,
            version: HFC.ver,
            instance: hfc,
            methods: hfc.methods,
          };
        });

        function onHfcPropsChange() {
          setupCommonAttrs();
          const { attrs, events, _ } = getHfcAttrsAndEventsFromVueAttrs();
          hfc.changed({ attrs, events, slots, _ });
        }

        const deepWatch = ctx.attrs._shallow === undefined;

        // this not fired when nested obj change
        onBeforeUpdate(() => {
          const slotLength = Object.keys(ctx.slots).length;
          if (slotLength !== prevSlotCount) {
            prevSlotCount = slotLength;
            slots = getHfcSlotsFromVueSlots();
            onHfcPropsChange();
            return;
          }

          if (!deepWatch) onHfcPropsChange();
        });

        if (deepWatch) {
          watch(
            () => ctx.attrs,
            () => {
              onHfcPropsChange();
            },
            { deep: true }
          );
        }

        // slots is not reactive
        // watch(
        //   () => ctx.slots,
        //   () => {}
        // );

        onBeforeUnmount(() => {
          hfc.disconnected();
        });

        return () => [h(HFC.tag, { ref: container }), h(RenderTeleports)];
      },
    });
  };
}
