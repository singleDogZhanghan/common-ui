import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

const printPageStyle = `
  .print-html {
    width: 100%;
  }
  table {
    border-collapse: collapse;
  }
  table td, table th {
    border: 1px solid #000;
    font-size: 15px;
  }
  .sale_order_record td, .sale_order_record th {
    font-size: 14px;
  }
  
  .bar-code img,.qr-code img{
    width: auto;
    height: auto;
    max-width: 90%;
    max-height: 90%;
  }
  .qr-code img{
    margin-top:8px;
    max-height: 90%;
  }
  .qr-code .qr-code-text{
    font-size: 12px;
    font-weight: 600;
    margin: 4px;
  }
`;

function getUrl(data, opt) {
  return new Promise((resolve) => {
    QRCode.toDataURL(data, opt, (error, url) => {
      resolve(url);
    });
  });
}

/**
 * 通用打印接口
 * @param requestParams {Object}   接口请求参数
 * @param dataInterface {Function}  接口函数
 * @param htmlStr {string}  html打印内容
 * @param qrCodeOptions {{string}}  二维码配置，参考npm qrcode
 * @param barCodeOptions {any}  一维码配置，参考npm jsBarcode
 */
export async function createCommonPrint({
  requestParams = {},
  dataInterface = null,
  htmlStr = '',
  qrCodeOptions = { margin: 0, text: false },
  barCodeOptions = { fontOptions: 'bold' }
}) {
  let htmlData = htmlStr;
  if (dataInterface) {
    const result = await dataInterface(requestParams);
    htmlData = result.data.code === 200 ? result.data.result : '';
  }
  if (!htmlData) {
    return;
  }
  const dom = document.createElement('div');
  dom.innerHTML = htmlData;
  const qrCodes = Array.from(dom.getElementsByClassName('qr-code'));
  // eslint-disable-next-line no-restricted-syntax
  for (const e of qrCodes) {
    const dataId = e.getAttribute('data-id');
    // eslint-disable-next-line no-await-in-loop
    const url = await getUrl(dataId, qrCodeOptions);
    e.innerHTML = `<img src="${url}"/> <span class="qr-code-text">${
      qrCodeOptions.text ? dataId : ''
    }</span>`;
  }
  const barCodes = Array.from(dom.getElementsByClassName('bar-code'));
  // eslint-disable-next-line no-restricted-syntax
  for (const e of barCodes) {
    const dataId = e.getAttribute('data-id');
    const img = document.createElement('img');
    JsBarcode(img, dataId, barCodeOptions);
    e.appendChild(img);
  }
  const printWindow = window.open(
    `${window.location.protocol}//${window.location.host}`,
    '_blank',
    ''
  );
  if (!printWindow || !printWindow.document) {
    return;
  }

  printWindow.document.open();
  printWindow.document.write(
    '<style type=\'text/css\'>',
    printPageStyle,
    '</style>'
  );
  printWindow.document.write(dom.outerHTML);
  printWindow.setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}
