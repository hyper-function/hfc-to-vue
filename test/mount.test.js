/**
 * @jest-environment jsdom
 */
import { mount } from "@vue/test-utils";
import hfcToVue from "../dist";

class Hfc {
  static propTypes = {};
  constructor(props) {
    console.log(props);
  }
  connected(container) {
    console.log("conn");
    container.innerHTML = "okok";
  }
  changed() {}
  disconnected() {}
}
console.log(hfcToVue);

const Comp = hfcToVue(Hfc);

test("displays message", () => {
  const wrapper = mount(Comp, {
    props: {
      msg: "Hello world",
    },
  });

  console.log(wrapper.html());
});
