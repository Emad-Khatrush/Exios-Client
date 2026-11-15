// The Exios warehouses abroad and the address text a seller needs, shared by "Our addresses" and
// "Start a shipment" so both always give the customer the same address.

export type Method = 'air' | 'sea';

export const CHINA_WAREHOUSE = {
  address: '广东省佛山市南区里水镇洲村工业区一横路15号之三A',
  contact: '杨生',
  phone: '19700263771',
  navigation: '明都LOFT青年社区',
  notes: [
    '送货时间:周一至周六早上9点至下午6点，周日休息，(送货之前一定要提前电话联系)',
    '空运货外箱需要套编织袋并注明“空运/BYAIR”及客户唛头，海运货(重货需套编织袋)并标注“海运/BYSEA”及客户唛头，仓库不提供卸货。',
    '所有货物品牌货不收(如果不如实告知目送至此仓库地址，本公司不承担任何责任后果需供货商自负)，货物如带电需贴电池防火标，随货需装箱单一份(并且需要发电子版给公司)。',
  ],
};

export const UAE_WAREHOUSE = {
  firstName: 'Exios',
  lastName: 'Company',
  phone: '+971505967929',
  line: 'SHED NO.2 RAS AL KHOR INDUSTRIAL AREA 2',
  city: 'Dubai',
  country: 'United Arab Emirates',
};

// The line the China warehouse sorts parcels by: method, customer code and the Libyan city code
export const warehouseCode = (method: Method, customerId: string, cityCode: string) => `${method}(${customerId}-${cityCode})`;

export const chinaAddressText = (code: string) => [
  `(Exios仓）${code} ${CHINA_WAREHOUSE.address}`,
  `联系人/Contact person: ${CHINA_WAREHOUSE.contact}:${CHINA_WAREHOUSE.phone}`,
  `备注(请认真阅读):（导航搜索：${CHINA_WAREHOUSE.navigation}）`,
  '',
  ...CHINA_WAREHOUSE.notes,
].join('\n');

export const uaeAddressLine = (customerId: string) => `${UAE_WAREHOUSE.line} DUBAI Sq336 Exios39 - ${customerId}`;

export const uaeAddressText = (customerId: string) => [
  `Name: ${UAE_WAREHOUSE.firstName}`,
  `Last Name: ${UAE_WAREHOUSE.lastName}`,
  `Phone: ${UAE_WAREHOUSE.phone}`,
  `Address: ${uaeAddressLine(customerId)}`,
].join('\n');
