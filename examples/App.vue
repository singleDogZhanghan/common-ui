<!-- 示例 -->
<template>
  <div ref="app">
    <h1>example</h1>
    <TransferTree v-bind="transferTreeConfig" :left-data="testData"           :table-config="tableConfig"/>
  </div>
</template>

<script>
import { TransferTree } from '@';

export default {
  components: {
    TransferTree
  },
  data() {
    return {
      tableConfig: [
        {
          name: 'materialName',
          label: '零部件',
          labelWidth: 300,
        },
        {
          name: 'specsModel',
          label: '规格',
          labelWidth: '200px',
        },
        {
          name: 'num',
          label: '数量',
          labelWidth: '100px',
        },
        {
          name: 'unit',
          label: '单位',
          labelWidth: '100px',
        },
        {
          name: 'level',
          label: '阶层',
          labelWidth: '100px',
        },
        {
          name: 'orderNum',
          label: '顺序码',
          labelWidth: '100px',
        },
        {
          name: 'drawings',
          label: '图纸',
          labelWidth: '100px',
        },
        {
          name: 'operate',
          label: '操作',
          labelWidth: '100px',
        }
      ],
      transferTreeConfig: {
        isTransfer: false,
        leftData: [],
        leftTreeConfig: {
          'node-key': 'id',
          'default-expand-all': true,
          'allow-drag': (node) => {
            return node.level !== 1 && this.isEdit;
          },
          props: {
            label: 'materialName',
          }
        },
      },
      testData: [
        {
          id: 1,
          materialName: 'XX01',
          materialCode: 'P0001',
          partCode: 'A0001',
          specsModel: 'test',
          num: '1',
          unit: '毛',
          state: 'haha',
          workState: 'oyouou',
          drawings: ['https://img0.baidu.com/it/u=2933393233,204738445&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
            'https://img0.baidu.com/it/u=812466216,3083992075&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'],
          children: [{
            id: 2,
            materialName: 'XX02',
            materialCode: 'P0002',
            partCode: 'A0002',
            specsModel: 'test22',
            num: '22',
            unit: '毛22',
            state: 'haha2222',
            workState: 'oyouou222',
            drawings: [],
            children: [{
              id: 3,
              materialName: 'XX03',
              materialCode: 'P0003',
              partCode: 'A0003',
              specsModel: 'test33',
              num: '33',
              unit: '毛33',
              state: 'haha33333',
              workState: 'oyouou33333',
              drawings: [],
            }]
          }]
        }, {
          id: 5,
          materialName: 'XX04',
          materialCode: 'P0004',
          partCode: 'A0004',
          specsModel: 'test44',
          num: '444',
          unit: '毛444',
          state: 'haha4444444',
          workState: 'oyouou444444',
          drawings: [],
        },
      ]
    };
  },
  computed: {},
  methods: {},
};
</script>
