<template>
  <div style="width:100%;margin: 8px">
    <el-popover
      placement="right"
      width="850"
      trigger="click"
    >
      <div class="header">
        <div class="tip">corn从左到右（用空格隔开）：秒 分 小时 月份中的日期 月份 星期中的日期 年份</div>
        <div class="clear-button"><el-button type="primary" size="mini" @click="resetCorn">重置</el-button></div>
      </div>
      <cron
          ref="cron"
          v-model="cronExpression"
          @input="setValue"
      />
      <el-input
        slot="reference"
        v-model="cronExpression"
        auto-complete="off"
        readonly
      />
    </el-popover>
  </div>
</template>

<script>
import cron from './cron'

export default {
  name: 'App',
  components: {
    cron
  },
  data() {
    return {
      cronExpression: '',
    }
  },
  created() {
    this.cronExpression = this.value;
    // 记录字段初始值
    window.sessionStorage.setItem('cronExpression', this.cronExpression);
  },
  beforeDestroy() {
    window.sessionStorage.removeItem('cronExpression');
  },
  methods: {
    setValue(value) {
      // TODO
    },
    resetCorn() {
      this.$refs.cron.updateVal(window.sessionStorage.getItem('cronExpression'));
    },
  }
}
</script>

<style scoped lang="scss">
  .header{
    display: flex;
    .tip{
      color: #E6A23C;
      font-size: 12px;
      flex: 1;
    }
    .clear-button{
      text-align: right;
      width: 60px;
    }
  }
</style>
