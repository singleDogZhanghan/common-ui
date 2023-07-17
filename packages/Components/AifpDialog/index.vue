<template>
  <transition name="dialog-fade" @after-leave="afterLeave">
    <div class="common-mask" v-show="visible" :style="{zIndex}">
      <div class="a-dialog-block a-dialog" :style="dialogStyle">
        <div class="a-dialog-block a-dialog-toolbar" v-if="showFullScreen">
          <span
              class="a-dialog-block a-dialog-toolbar-button"
              @click="fullScreen = !fullScreen"
          >
            <i
                class="aifp-dialog-iconfont"
                :class="fullScreen ? 'icon-full-screen' : 'icon-not-full-screen'"
            />
          </span>
        </div>

        <div
            class="a-dialog-block a-dialog-close"
            @click="cancel"
            v-if="showCloseButton"
        >
          <i class="aifp-dialog-iconfont icon-close"/>
        </div>

        <div class="a-dialog-block a-dialog-head" v-if="title">
          <slot name="title">
            {{ title }}
          </slot>
        </div>

        <div class="a-dialog-block a-dialog-body">
          <slot name="content"/>
          <slot name="icon" v-if="icon">
            <el-image v-bind="icon" :src="typeof icon==='string'?icon:icon.src"/>
          </slot>
          <slot name="message" v-if="message">
            <p class="message-content">{{ message }}</p>
          </slot>
        </div>

        <div class="a-dialog-block a-dialog-foot" v-if="showFooter">
          <button
              type="button"
              v-if="cancelText"
              class="a-dialog-button a-dialog-button-cancel"
              @click="cancel"
          >
            {{ cancelText }}
          </button>

          <slot name="button"/>

          <button v-if="confirmText" class="a-dialog-button" @click="confirm" type="button">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>

</template>
<script>
import '../../assets/css/font.css';

export default {
  name: 'AifpDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    width: {
      type: [Number, String], // 数字表示0-100的百分比，字符串表示固定值，单位自定px,vw,rem
      default: 30
    },
    minWidth: {
      type: [Number, String],
      default: '600px'
    },
    maxWidth: {
      type: [Number, String],
      default: 'auto'
    },
    height: {
      type: [Number, String],
      default: 20
    },
    minHeight: {
      type: [Number, String],
      default: '400px'
    },
    maxHeight: {
      type: [Number, String],
      default: 'auto'
    },
    title: {
      type: String,
      default: ''
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    cancelCallback: {
      type: Function
    },
    confirmText: {
      type: String,
      default: '确定'
    },
    confirmCallback: {
      type: Function
    },
    closedCallback: {
      type: Function
    },
    message: {
      type: String
    },
    icon: {
      type: [Object, String],
      default: null
    },
    showFullScreen: {
      type: Boolean,
      default: true
    },
    showCloseButton: {
      type: Boolean,
      default: true
    },
    showFooter: {
      type: Boolean,
      default: true
    },
    openMode: {
      type: String,
      default: 'el-fade-in'
    },
    zIndex: {
      type: Number,
      default: () => {
        const jBody = document.querySelector('#J_body');
        if (!jBody || !jBody.children.length) {
          return 199;
        }
        return Math.max(199, ...Array.from(jBody.children).map(e => Number(e.style['z-index'])));
      }
    }
  },
  data() {
    return {
      fullScreen: false,
      isConfirm: false,
    };
  },
  computed: {
    dialogStyle() {
      if (this.fullScreen) {
        return {
          width: '100vw',
          height: '100vh',
          zIndex: 201
        };
      }
      return {
        zIndex: 201,
        top: '10%',
        width:
            typeof this.width === 'string' ? `${this.width}` : `${this.width}vw`,
        height:
            typeof this.height === 'string'
              ? `${this.height}`
              : `${this.height}vh`,
        minWidth:
            typeof this.minWidth === 'string'
              ? `${this.minWidth}`
              : `${this.minWidth}px`,
        minHeight:
            typeof this.minHeight === 'string'
              ? `${this.minHeight}`
              : `${this.minHeight}px`,
        maxWidth:
            typeof this.maxWidth === 'string'
              ? `${this.maxWidth}`
              : `${this.maxWidth}px`,
        maxHeight:
            typeof this.maxHeight === 'string'
              ? `${this.maxHeight}`
              : `${this.maxHeight}px`
      };
    }
  },
  methods: {
    cancel() {
      this.isConfirm = false;
      this.$emit('update:visible', false);
      this.$emit('cancel');
      if (this.cancelCallback) {
        this.cancelCallback();
      }
    },
    confirm() {
      this.isConfirm = true;
      this.$emit('update:visible', false);
      this.$emit('confirm');
      if (this.confirmCallback) {
        this.confirmCallback();
      }
    },
    afterLeave() {
      this.fullScreen = false;
      this.$emit('closed', this.isConfirm);
      if (this.closedCallback) {
        this.closedCallback(this.isConfirm);
      }
    }
  }
};
</script>
<style lang="scss">
.common-mask {
  transition: all .25s ease-in-out;
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 199;
  display: flex;
  justify-content: center;
  align-items: center;
}

.a-dialog {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  position: fixed;
  margin-top: 0;
  border: 1px solid rgba(0, 0, 0, 0.3);
  overflow: hidden;
  background: #fff;
  color: #596b89;
  transition: all 0.25s;

  .aifp-dialog-iconfont {
    font-size: 14px;
    color: #bbc5d5;
    font-style: normal;
    font-family: "aifp-dialog-iconfont" !important;
    cursor: pointer;
  }

  .icon-not-full-screen:before {
    content: "\E7F8";
  }

  .icon-full-screen:before {
    content: "\E7F7";
  }

  .a-dialog-toolbar {
    position: absolute;
    z-index: 3;
    top: 12px;
    right: 36px;

    .a-dialog-toolbar-button {
      display: inline-block;
      width: 24px;
      height: 24px;
      margin: 0 5px;
      opacity: 1;
      cursor: pointer;
      line-height: 24px;
      text-align: center;
      font-size: 0;
    }
  }

  .a-dialog-close {
    position: absolute;
    z-index: 3;
    top: 10px;
    right: 18px;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;

    .aifp-dialog-iconfont {
      font-size: 10px;
    }

    .icon-close:before {
      content: "\E60C";
    }
  }

  .a-dialog-head {
    flex: 0 0 auto;;
    width: 100%;
    height: 48px;
    padding: 0 20px;
    border-bottom: 1px solid #d8dde4;
    text-align: center;
    line-height: 48px;
    font-size: 16px;
    font-weight: bold;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    box-sizing: border-box;
  }

  .a-dialog-body {
    flex: 1 1 auto;
    width: 100%;
    height: calc(100% - 96px);
    overflow: auto;
    font-size: 14px;
    word-break: break-all;
    text-align: center;
    display: grid;
    grid-template-columns: 1fr;
    place-items: center;
  }

  .a-dialog-foot {
    width: 100%;
    height: 48px;
    flex: 0 0 auto;;
    padding: 0 20px;
    border-top: 1px solid #d8dde4;
    line-height: 46px;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .a-dialog-button {
    display: inline-block;
    min-width: 72px;
    margin: 0 8px;
    padding: 0 5px;
    height: 32px;
    border: 0;
    border-radius: 2px;
    background: #4680ff;
    color: #fff;
    vertical-align: middle;
    font-size: 12px;
    line-height: 32px;
    text-align: center;
    cursor: pointer;
    outline: none;
  }

  .a-dialog-button-cancel {
    background: #bbc5d5;
  }
}

.message-content {
  text-align: center;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  padding: 0 20px;
  line-height: 20px;
  color: #333333;
}

.el-image {
  width: 60px;
  height: 60px;
}
</style>
