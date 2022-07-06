import type IVue from "vue";
export default function (Vue: typeof IVue): (HFC: typeof HyperFunctionComponent) => IVue.DefineComponent<Readonly<{
    [x: string]: any;
}>, () => (IVue.VNode<IVue.RendererNode, IVue.RendererElement, {
    [key: string]: any;
}> | IVue.VNode<IVue.RendererNode, IVue.RendererElement, {
    [key: string]: any;
}>[])[], unknown, {}, {}, IVue.ComponentOptionsMixin, IVue.ComponentOptionsMixin, Record<string, any>, string, IVue.VNodeProps & IVue.AllowedComponentProps & IVue.ComponentCustomProps, Readonly<{
    [x: string]: unknown;
} & {
    [x: string]: any;
} & {}>, {
    [x: string]: any;
}>;
