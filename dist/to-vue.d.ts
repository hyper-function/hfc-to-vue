/// <reference types="hyper-function-component" />
import type IVue from "vue";
export default function (Vue: typeof IVue): (HFC: typeof HyperFunctionComponent) => IVue.DefineComponent<{}, () => any[], {}, {}, {}, IVue.ComponentOptionsMixin, IVue.ComponentOptionsMixin, IVue.EmitsOptions, string, IVue.VNodeProps & IVue.AllowedComponentProps & IVue.ComponentCustomProps, Readonly<{} & {} & {}>, {}>;
