/// <reference types="../src/hfc" />
import { test, expect } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import hfcToVue from "../src";

const DemoHfc: HyperFunctionComponent = function DemoHfc(container, initProps) {
  function render(props: HfcProps) {
    const html = `a: ${props.attrs.a}, b: ${props.attrs.b}, c: ${props.attrs.c[0]}, d: ${props.attrs.d.e.f}`;
    container.innerHTML = html;
  }

  render(initProps);

  return {
    methods: {},
    changed(props) {
      render(props);
    },
    disconnected() {},
  };
};

DemoHfc.tag = "strong";
DemoHfc.ver = "1.0.0";
DemoHfc.hfc = "demo-hfc";
DemoHfc.names = [["a", "b", "c", "d"], [], [], []];

test("pass attrs", async () => {
  const Hfc = hfcToVue(DemoHfc);
  const wrapper = mount({
    data() {
      return { a: 1, b: "b", c: [1], d: { e: { f: 2 } } };
    },
    template: `
      <hfc :a="a" :b="b" :c="c" :d="d" />
    `,
    components: { Hfc },
    methods: {
      changeArr() {
        this.c = [2];
      },
      changeObj() {
        this.d.e.f = 3;
      },
    },
  });

  expect(wrapper.html()).include("a: 1, b: b, c: 1, d: 2");

  wrapper.setData({ a: 2 });
  await nextTick();
  expect(wrapper.html()).include("a: 2, b: b, c: 1, d: 2");

  wrapper.vm.changeArr();
  await nextTick();
  expect(wrapper.html()).include("a: 2, b: b, c: 2, d: 2");

  wrapper.vm.changeObj();
  await nextTick();
  expect(wrapper.html()).include("a: 2, b: b, c: 2, d: 3");
});
