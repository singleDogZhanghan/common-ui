<template lang="html">
  <div
    class="cron"
    :val="value_"
  >
    <el-tabs v-model="activeName">
      <el-tab-pane
        label="秒"
        name="s"
      >
        <SecondAndMinute
          v-model="sVal"
          lable="秒"
        />
      </el-tab-pane>
      <el-tab-pane
        label="分"
        name="m"
      >
        <SecondAndMinute
          v-model="mVal"
          lable="分"
        />
      </el-tab-pane>
      <el-tab-pane
        label="时"
        name="h"
      >
        <hour
          v-model="hVal"
          lable="时"
        />
      </el-tab-pane>
      <el-tab-pane
        label="日"
        name="d"
      >
        <day
          v-model="dVal"
          lable="日"
        />
      </el-tab-pane>
      <el-tab-pane
        label="月"
        name="month"
      >
        <month
          v-model="monthVal"
          lable="月"
        />
      </el-tab-pane>
      <el-tab-pane
        label="周"
        name="week"
      >
        <week
          v-model="weekVal"
          lable="周"
        />
      </el-tab-pane>
      <el-tab-pane
        label="年"
        name="year"
      >
        <year
          v-model="yearVal"
          lable="年"
        />
      </el-tab-pane>
    </el-tabs>
    <!-- table -->
    <el-table
      :data="tableData"
      size="mini"
      border
      style="width: 100%;"
    >
      <el-table-column
        prop="sVal"
        label="秒"
        width="70"
      />
      <el-table-column
        prop="mVal"
        label="分"
        width="70"
      />
      <el-table-column
        prop="hVal"
        label="时"
        width="70"
      />
      <el-table-column
        prop="dVal"
        label="日"
        width="70"
      />
      <el-table-column
        prop="monthVal"
        label="月"
        width="70"
      />
      <el-table-column
        prop="weekVal"
        label="周"
        width="70"
      />
      <el-table-column
        prop="yearVal"
        label="年"
      />
    </el-table>
  </div>
</template>

<script>
import SecondAndMinute from './cron/secondAndMinute'
import hour from './cron/hour'
import day from './cron/day'
import month from './cron/month'
import week from './cron/week'
import year from './cron/year'

export default {
  components: {
    SecondAndMinute, hour, day, month, week, year
  },
  props: {
    value: {
      type: String
    }
  },
  data() {
    return {
      activeName: 's',
      sVal: '00',
      mVal: '00',
      hVal: '00',
      dVal: '*',
      monthVal: '*',
      weekVal: '?',
      yearVal: '*'
    }
  },
  computed: {
    tableData() {
      return [{
        sVal: this.sVal,
        mVal: this.mVal,
        hVal: this.hVal,
        dVal: this.dVal,
        monthVal: this.monthVal,
        weekVal: this.weekVal,
        yearVal: this.yearVal
      }]
    },
    // eslint-disable-next-line no-underscore-dangle
    value_() {
      if (!this.dVal && !this.weekVal) {
        return ''
      }
      if (this.dVal === '?' && this.weekVal === '?') {
        this.$message.error('日期与星期不可以同时为“不指定”')
        return
      }
      if (this.dVal !== '?' && this.weekVal !== '?') {
        this.$message.error('日期与星期必须有一个为“不指定”')
        return
      }
      const v = `${this.sVal} ${this.mVal} ${this.hVal} ${this.dVal} ${this.monthVal} ${this.weekVal} ${this.yearVal}`
      if (v !== this.value) {
        this.$emit('input', v)
      }
      return v
    }
  },
  watch: {
    value() {
      this.updateVal(this.value)
    }
  },
  created() {
    this.updateVal(this.value)
  },
  methods: {
    updateVal(value) {
      if (!value) {
        return
      }
      const arrays = value.split(' ')
      this.sVal = arrays[0]
      this.mVal = arrays[1]
      this.hVal = arrays[2]
      this.dVal = arrays[3]
      this.monthVal = arrays[4]
      this.weekVal = arrays[5]
      this.yearVal = arrays[6]
    }
  }
}
</script>

<style lang="css">
  .cron {
    text-align: left;
    padding: 10px;
    background: #fff;
  }
</style>
