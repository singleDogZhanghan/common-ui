# common-ui-zh
```
A Component library based on Element-UI
```

## Install
```
npm install common-ui-zh -S
```

## Quick Start
```
import Vue from 'vue'
import CommonUi from 'common-ui-zh'

Vue.use(CommonUi)

// or
import {
  LazySelect,
  // ...
} from 'common-ui-zh'

Vue.component(LazySelect.name, LazySelect)
```

## Component
```
{
  "CommonDialog": "@/Component/CommonDialog/index.vue",
  "LazySelect": "@/Component/LazySelect/index.vue",
  "TreeDialog": "@/Component/TreeDialog/index.vue",
  "TransferTree": "@/Component/TransferTree/index.vue"
}
```

## Method
```
{
  "createCommonDialog": "@/Util/commonConfirm.js",
  "createCommonPrint": "@/Util/commonPrint.js",
  "createCommonTreeDialog": "@/Util/commonTreeDialog.js",
  "commonMerge": "@/Util/commonMethods.js",
  "setNodeKey": "@/Util/commonMethods.js"
}
```
