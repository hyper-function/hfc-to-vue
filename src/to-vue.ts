import type IVue from "vue";

export default function (Vue: typeof IVue) {
  const {
    h,
    ref,
    toRaw,
    isProxy,
    reactive,
    Teleport,
    onMounted,
    onBeforeUpdate,
    onBeforeUnmount,
    defineComponent,
  } = Vue;

  return function hfcToVue(HFC: typeof HyperFunctionComponent) {
    const attrNames = HFC.propNames.attrs;
    const eventNames = HFC.propNames.events;
    const slotNames = HFC.propNames.slots;

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
      setup(_, ctx) {
        const teleports = reactive<any[]>([]);

        function ctxToProps() {
          const attrs: Record<string, any> = {};
          const events: Record<string, any> = {};
          const slots: Record<string, any> = {};
          const others: Record<string, any> = {};

          const keys = Object.keys(ctx.attrs);
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];

            const attrName = attrNameMap.get(key);
            if (attrName) {
              let val = ctx.attrs[key] as any;
              if (isProxy(val)) val = toRaw(val);
              attrs[attrName] = val;
              continue;
            }

            const eventName = eventNameMap.get(key);
            if (eventName) {
              events[eventName] = ctx.attrs[key] as any;
              continue;
            }

            let otherKey = key;
            const otherValue = ctx.attrs[key] as any;
            if (typeof otherValue === "function") {
              otherKey = key[2].toLowerCase() + key.slice(3);
            }
            others[otherKey] = otherValue;
          }

          const slotKeys = Object.keys(ctx.slots);
          for (let i = 0; i < slotKeys.length; i++) {
            const slotKey = slotKeys[i];
            const slotName = slotNameMap.get(slotKey);
            if (!slotName) continue;

            const slot = ctx.slots[slotKey]!;
            slots[slotName] = function (container: HTMLElement, args: any) {
              const vnode = h(Teleport, { to: container }, slot(args));
              (vnode as any).name = slotName;
              const index = teleports.findIndex(
                (item) => (item as any).name === slotName
              );

              index === -1 ? teleports.push(vnode) : (teleports[index] = vnode);
            };
          }

          return { attrs, events, others, slots };
        }

        let hfc: HyperFunctionComponent;
        const container = ref<HTMLElement>();
        onMounted(() => {
          const props = ctxToProps();
          hfc = new HFC(container.value!, props);
        });

        onBeforeUpdate(() => {
          const props = ctxToProps();
          hfc.changed(props);
        });

        onBeforeUnmount(() => {
          hfc.disconnected();
        });

        return () => [h(HFC.tag, { ref: container }), ...teleports];
      },
    });
  };
}
