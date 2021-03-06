/**
 * base.js
 *
 * Copyright (c) 2019 chengaohe All rights reserved.
 *
 * 无缝对接vue组件
 *
 */

import utils from "./libs/utils.js";
import constant from "./libs/constant.js";
// import { throws } from "assert";

("use strict");

export default {
  render: function(createElement) {
    if (!this.config.name) {
      console.error("错误的config: ", this.config);
      throw "es-base config.name必须存在";
    }

    // 防止props不存在
    var configProps = this.config.props ? this.config.props : {};

    // 计算出props, attrs
    var newProps = {};
    var newAttrs = {};
    var domProps = {};

    var directives = this.config.directives
      ? utils.deepCopy(this.config.directives)
      : []; // false, 不是数组也没有事

    var componentName = this.config.name.toLowerCase
      ? this.config.name.toLowerCase()
      : this.config.name;
    if (
      componentName === constant.TAG_INPUT && // 不区分大小写
      (configProps.type === constant.TYPE_RADIO ||
        configProps.type === constant.TYPE_CHECKBOX)
    ) {
      if (configProps.type === constant.TYPE_RADIO) {
        Object.assign(newAttrs, configProps);
        if (this.config.hasOwnProperty("value")) {
          // 用户设置了value的情况
          newAttrs.checked = this.config.value === configProps.value;
        } else {
          // 没有用户value
          newAttrs.checked =
            configProps.hasOwnProperty("checked") &&
            configProps.checked !== false
              ? true
              : false;
        }

        Object.assign(newProps, configProps);
        if (newProps.hasOwnProperty("checked")) {
          delete newProps.checked;
        }

        domProps.checked = newAttrs.checked;
      } else {
        var checked = false;
        if (this.config.hasOwnProperty("value")) {
          if (!utils.isUndef(configProps.trueValue)) {
            // 经测试，若指定了trueValue，无论falseValue是否指定，只有值等于trueValue，checked才为true
            if (this.config.value === configProps.trueValue) {
              checked = true;
            } else {
              checked = false;
            }
          } else if (!utils.isUndef(configProps.falseValue)) {
            // 经测试：当trueValue没有指定，falseValue指定，只有值等于falseValue，checked才为false
            if (this.config.value === configProps.falseValue) {
              checked = false;
            } else {
              checked = true;
            }
          } else {
            // 经测试：当trueValue和falseValue没有指定，checked才为!!this.config.value
            checked = !!this.config.value;
          }
        } else {
          checked =
            configProps.hasOwnProperty("checked") &&
            configProps.checked !== false
              ? true
              : false;
        }
        Object.assign(newAttrs, configProps);
        newAttrs.checked = checked;

        Object.assign(newProps, configProps);
        if (newProps.hasOwnProperty("checked")) {
          delete newProps.checked;
        }

        domProps.checked = newAttrs.checked;
      }
    } else {
      var newValue;
      if (this.config.hasOwnProperty("value")) {
        newValue = utils.isRefVal(this.config.value)
          ? utils.deepCopy(this.config.value)
          : this.config.value; // 这样防止引用地址被组件内部修改
      } else {
        newValue = configProps.value;
      }
      if (!constant.FORM_INPUTS.includes(componentName)) {
        Object.assign(newAttrs, configProps);
        if (newAttrs.hasOwnProperty("value")) {
          delete newAttrs.value;
        }
        Object.assign(newProps, configProps);
        newProps.value = newValue;
      } else {
        Object.assign(newAttrs, configProps);
        if (newAttrs.hasOwnProperty("value")) {
          delete newAttrs.value;
        }

        Object.assign(newProps, configProps);
        if (newProps.hasOwnProperty("value")) {
          delete newProps.value;
        }

        // 经测试（value）：
        // textarea必须要在domProps才能显示；
        // input第一次可以在newAttrs写，之后也要在domProps才能显示值，所以也要是domProps才保险
        domProps.value = newValue;
      }
    }

    var vnode = createElement(
      this.config.name, // tag name 标签名称 https://www.cnblogs.com/tugenhua0707/p/7528621.html
      {
        attrs: newAttrs, //attrs为原生属性

        // 类型要求见：https://cn.vuejs.org/v2/guide/class-and-style.html
        // this.config.class必须是String,Object, Array才能有效；当然传入其它类型也可以，只是没有效果，也不会报错，因为createElement会做处理
        class: this.config.class,
        style: this.config.style, // this.config.style必须是一个对象才能有效；原理同上

        domProps: domProps, // DOM属性

        props: newProps, // 组件props
        // 事件监听基于 "on"
        // 所以不再支持如 "v-on:keyup.enter" 修饰语
        // 需要手动匹配 KeyCode
        on: this.$data.emitOn,

        // 仅对于组件，用于监听原生事件，而不是组件内部使用 `vm.$emit` 触发的事件。
        nativeOn: this.$data.nativeOn,

        // 自定义指令。注意事项：不能对绑定的旧值设值
        // Vue 会为您持续追踪
        // directives: [
        //   // {
        //   // 	name: "my-custom-directive",
        //   // 	value: "2",
        //   // 	expression: "1 + 1",
        //   // 	arg: "foo",
        //   // 	modifiers: {
        //   // 		bar: true
        //   // 	}
        //   // }
        // ],
        directives: directives,
        // Scoped slots in the form of
        // { name: props => VNode | Array<VNode> }
        scopedSlots: {
          // default: props => createElement('span', props.text + "test3")
        },
        // 如果组件是其他组件的子组件，需为插槽指定名称
        // slot: "name-of-slot",
        // 其他特殊顶层属性
        // key: "myKey",
        ref: "__comTarget__"
      },
      // [createElement('span', "test")]
      // ["test2"]
      // "测试{{config.value}}" // 子组件中的阵列
      this.config.text
    );

    // 去除多余的原生属性；去不去掉感觉都没有什么，好像没有影响到功能，只是页面上会显示原生属性
    var componentOptions = vnode.componentOptions;
    var dataAttrs = {};
    var comProps =
      componentOptions && componentOptions.Ctor.options.props
        ? componentOptions.Ctor.options.props
        : false;
    if (
      comProps &&
      Object.keys(comProps).length &&
      Object.keys(configProps).length
    ) {
      var comPropsKeys = Object.keys(comProps); // 经测试：就算在定义中声明为中划线形式，这里也会返回驼峰式，如 'text-str' => 'textStr'
      for (var key in configProps) {
        if (!comPropsKeys.includes(key)) {
          dataAttrs[key] = configProps[key];
        }
      }
      if (vnode.data) {
        vnode.data.attrs = dataAttrs;
      }
    }

    newAttrs = null;
    newProps = null;
    domProps = null;
    directives = null;

    configProps = null;

    return vnode;
  },
  // inheritAttrs: false,
  props: {
    config: {
      type: Object,
      required: true,
      default: () => {
        return {
          name: "" //lg-element 组件 原生组件
          // value: "",
          // attrs: {},
          // style: {},
          // class: {},
          // props: {}
        };
      }
    },

    // 当!!this.info为非真时，处理事件会让父级处理
    info: {
      type: Object,
      required: false,
      default: undefined
    }

    // emitEvents: {
    //   type: Array,
    //   required: false,
    //   default: null
    // },

    // nativeEvents: {
    //   type: Array,
    //   required: false,
    //   default: null
    // },

    // value: {
    //   type: [Object, String, Date, Array, Boolean, Number],
    //   required: false
    // }
  },

  data() {
    return {
      emitOn: null,
      nativeOn: null
    };
  },

  created() {
    this.initUi();
  },

  methods: {
    initUi() {
      this.createOn();
    },

    eventHandler(eventName, args) {
      args = args ? args : [];
      if (!this.info) {
        // 让父类去处理
        this.$emit("trigger", eventName, args, this.$refs.__comTarget__);
      } else {
        // 一般组件，自己处理
        var options = {
          value: utils.deepCopy(this.config.value),
          event: args[0],
          args: args,
          pathKey: this.info.pathKey,
          index: this.info.index,
          idxChain: this.info.idxChain,
          target: this.$refs.__comTarget__
        };

        var handlers = [];
        var actions = this.config.actions;
        if (actions) {
          actions.forEach(action => {
            if (action.trigger && action.trigger.includes(eventName)) {
              handlers.push(action.handler);
            }
          });
        }

        if (handlers.length > 0) {
          var thisFrom = this.__getForm();
          thisFrom._handleEvents(handlers, options);
        }
      }
    },

    __getForm() {
      var formItem = this.$parent;
      while (formItem) {
        var type = formItem._getType ? formItem._getType() : "";
        if (type == constant.UI_FORM) {
          // formItem._syncFormUi(checkSchema, eventNames, targetValue, eventData); // 最外层的表单层同步所有的ui及数位
          return formItem; // 到达表单层
        } else if (type == constant.UI_ARRAY) {
          // checkSchema.push(formItem._getSchema());
        } else {
          // ... 往上派
        }
        formItem = formItem.$parent;
      }
    },

    __parseInputEvent(eventData) {
      var eventValue;
      if (eventData && eventData.target && eventData.target.nodeName) {
        var tagName = eventData.target.tagName;
        var nodeType = eventData.target.type;
        if (tagName.toLowerCase() === constant.TAG_INPUT) {
          var configProps;
          if (nodeType === constant.TYPE_RADIO) {
            // 防止props不存在
            configProps = this.config.props ? this.config.props : {};
            if (eventData.target.checked) {
              eventValue = configProps.value;
            } else {
              eventValue = undefined;
            }
          } else if (nodeType === constant.TYPE_CHECKBOX) {
            // 防止props不存在
            configProps = this.config.props ? this.config.props : {};
            if (eventData.target.checked) {
              eventValue = true;
              if (!utils.isUndef(configProps.trueValue)) {
                eventValue = configProps.trueValue;
              }
            } else {
              eventValue = false;
              if (!utils.isUndef(configProps.falseValue)) {
                eventValue = configProps.falseValue;
              }
            }
          } else {
            eventValue = eventData.target.value;
          }
        } else {
          eventValue = eventData.target.value;
        }
      } else {
        eventValue = eventData;
      }
      return eventValue;
    },

    /**
     * 创建所需要监听的事件
     */
    createOn() {
      var _thisVm = this;

      var hasOwnValue = this.config.hasOwnProperty("value");
      var emitEvents;
      if (this.config.__emitEvents) {
        emitEvents = utils.deepCopy(this.config.__emitEvents);
        if (hasOwnValue && !emitEvents.includes(constant.INPUT_EVENT)) {
          emitEvents.push(constant.INPUT_EVENT);
        }
      } else {
        if (hasOwnValue) {
          emitEvents = [constant.INPUT_EVENT];
        } else {
          emitEvents = [];
        }
      }

      // emit发出的事件
      var emitOn = {};
      emitEvents.forEach(eventName => {
        if (eventName == constant.INPUT_EVENT && hasOwnValue) {
          emitOn[eventName] = function(eventData) {
            var eventValue = _thisVm.__parseInputEvent(eventData);
            if (_thisVm.config.value !== eventValue) {
              _thisVm.config.value = eventValue;
              _thisVm.eventHandler(eventName, arguments);
            }
          };
        } else {
          emitOn[eventName] = function() {
            _thisVm.eventHandler(eventName, arguments);
          };
        }
      });

      this.$data.emitOn = Object.keys(emitOn).length > 0 ? emitOn : null;

      //原生事件
      // emit发出的事件
      if (this.config.__nativeEvents && this.config.__nativeEvents.length > 0) {
        var nativeOn = {};
        var nativeEvents = utils.deepCopy(this.config.__nativeEvents);
        nativeEvents.forEach(eventName => {
          nativeOn[eventName] = function() {
            _thisVm.eventHandler(
              eventName + "." + constant.ADJ_NATIVE,
              arguments
            );
          };
        });

        this.$data.nativeOn =
          Object.keys(nativeOn).length > 0 ? nativeOn : null;
      } else {
        this.$data.nativeOn = null;
      }

      if (!this.$data.emitOn && !this.$data.nativeOn) {
        _thisVm = undefined; // 没有关联清除
      }
    }
  },

  destroyed() {},

  watch: {
    config: {
      handler: function(/* newVal, oldVal */) {
        // console.log("base.config here...");
        this.initUi();
      },
      deep: false
    }
  }
};
