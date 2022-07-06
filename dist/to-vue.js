export default function (Vue) {
    const { h, ref, reactive, Teleport, onMounted, onBeforeUpdate, onBeforeUnmount, defineComponent, } = Vue;
    return function hfcToVue(HFC) {
        const attrNames = HFC.propNames.attrs;
        const eventNames = HFC.propNames.events;
        const slotNames = HFC.propNames.slots;
        const attrNameMap = new Map();
        for (let i = 0; i < attrNames.length; i++) {
            const name = attrNames[i];
            attrNameMap.set(name, name);
            attrNameMap.set(name.toLowerCase(), name);
            attrNameMap.set(name.replace(/[A-Z]/g, "-$&").toLowerCase(), name);
        }
        const eventNameMap = new Map();
        for (let i = 0; i < eventNames.length; i++) {
            const name = eventNames[i];
            const firstChar = name[0].toUpperCase();
            const restChar = name.slice(1);
            eventNameMap.set("on" + firstChar + restChar, name);
            eventNameMap.set("on" + firstChar + restChar.toLowerCase(), name);
        }
        const slotNameMap = new Map();
        for (let i = 0; i < slotNames.length; i++) {
            const name = slotNames[i];
            slotNameMap.set(name, name);
            slotNameMap.set(name.toLowerCase(), name);
            slotNameMap.set(name.replace(/[A-Z]/g, "-$&").toLowerCase(), name);
        }
        return defineComponent({
            inheritAttrs: false,
            setup(_, ctx) {
                const slots = {};
                const teleports = reactive([]);
                Object.keys(ctx.slots).forEach((slotKey) => {
                    const slotName = slotNameMap.get(slotKey);
                    if (!slotName)
                        return;
                    const slot = ctx.slots[slotKey];
                    slots[slotName] = function (container, args) {
                        const vnode = h(Teleport, { to: container }, slot(args));
                        vnode.name = slotName;
                        const index = teleports.findIndex((item) => item.name === slotName);
                        if (index === -1) {
                            teleports.push(vnode);
                        }
                        else {
                            teleports[index] = vnode;
                        }
                    };
                });
                function getProps() {
                    const attrs = {};
                    const events = {};
                    const others = {};
                    const keys = Object.keys(ctx.attrs);
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        const attrName = attrNameMap.get(key);
                        if (attrName) {
                            attrs[attrName] = ctx.attrs[key];
                            continue;
                        }
                        const eventName = eventNameMap.get(key);
                        if (eventName) {
                            events[eventName] = ctx.attrs[key];
                            continue;
                        }
                        others[key] = ctx.attrs[key];
                    }
                    return { attrs, events, others, slots };
                }
                let hfc;
                const container = ref();
                onMounted(() => {
                    const props = getProps();
                    hfc = new HFC(container.value, props);
                });
                onBeforeUpdate(() => {
                    const props = getProps();
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
