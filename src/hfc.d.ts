type HyperFunctionComponent = ((
  container: Element,
  initProps: HfcProps
) => {
  methods: HfcMethods;
  changed: (props: HfcProps) => void;
  disconnected: () => void;
}) & {
  // container tag name
  tag: string;
  // hfc name
  hfc: string;
  // hfc version
  ver: string;
  // [AttrNames, EventNames, SlotNames, MethodNames]
  names: [string[], string[], string[], string[]];
};

type HfcProps = {
  attrs: { [k: string]: any };
  events: { [k: string]: (args?: { [k: string]: any }) => any };
  slots: {
    [k: string]: (
      container: Element,
      args?: { key?: string; [k: string]: any }
    ) => void;
  };
  // all props
  _: { [k: string]: any };
};

type HfcMethods = {
  [k: string]: (args?: { [k: string]: any }) => any;
};
