import type { HyperFunctionComponent } from "hyper-function-component";
import { test, expect } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import hfcToVue from "../src";

const DemoHfc: HyperFunctionComponent = function DemoHfc(initProps) {
  let target: Element;
  function render(props: any) {
    const html = `a: ${props.attrs.a}, b: ${props.attrs.b}, c: ${props.attrs.c[0]}, d: ${props.attrs.d.e.f}`;
    target.innerHTML = html;
  }

  return {
    methods: {},
    connected(container) {
      target = container;
      render(initProps);
    },
    updated(props) {
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
      <hfc
        id="abs"
        class="a"
        :class="['b']"
        style="font-size: 14px"
        :style="{ fontWeight: '800' }"
        :a="a"
        :b="b"
        :c="c"
        :d="d"
      />
    `,
    components: { Hfc },
  });

  expect(wrapper.html()).include('id="abs"');
  expect(wrapper.html()).include('class="a b"');
  expect(wrapper.html()).include(`style="font-size: 14px; font-weight: 800;"`);
  expect(wrapper.html()).include("a: 1, b: b, c: 1, d: 2");

  wrapper.vm.$data.a = 2;
  await nextTick();
  expect(wrapper.html()).include("a: 2, b: b, c: 1, d: 2");

  wrapper.vm.$data.c[0] = 2;
  await nextTick();
  expect(wrapper.html()).include("a: 2, b: b, c: 2, d: 2");

  wrapper.vm.$data.d = {
    e: {
      f: 3,
    },
  };
  await nextTick();
  expect(wrapper.html()).include("a: 2, b: b, c: 2, d: 3");
});
