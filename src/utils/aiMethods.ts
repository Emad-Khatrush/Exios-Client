export const generateMessageForAirShipping = (passedDays: number) => {
  // 19 Days to arrive to Libya
  const expectedArrivalDays = 19;
  const remainingDays = expectedArrivalDays - passedDays;

  if (remainingDays >= 1) {
    return `البضائع الان في طريقها الى ليبيا، الوقت المتوقع وصوله في غضون ${remainingDays} ايام في حالة عدم حدوث اي تعطيلات خارجه عن الاراده`
  } else if (remainingDays === 0) {
    return `نتأسف على تاخير في الشحنه بسبب ظروف خارجه عن ارادتنا، انتظر منا رد غدا لمعرفة الموعد المتوقع للاستلام`;
  } else if (remainingDays >= -5) {
    return `نتأسف مجددا على التاخير الذي حدث في شحنتك، وذلك باسباب مثل تاجيل في رحلات الدولية واجراءات الجمركية وغيرها، متوقع وصول بضائع في غضون ${6 - Math.abs(remainingDays)} ايام في حالة تاخرت اكثر من ذلك سيتم تقديم لك كوبون خصم حصري لك تعويضا على تاخير`;
  } else {
    return `نتأسف على التأخير الخارج عن ارادتنا عميلنا العزيز، قد يحدث تأخير في مسار الشحن ولكن لا تقلق شركة إكسيوس تقوم بالعمل لاخراج البضائع من الجمارك في اسرع وقت وعند وصوله وانهاء من الجرد سيتم التواصل معكم فورا للاستلام، شكرا لتفاهمكم`
  }
}

export const generateMessageForSeaShipping = (passedDays: number) => {
  // 19 Days to arrive to Libya
  const expectedArrivalDays = 60;
  const remainingDays = expectedArrivalDays - passedDays;

  if (remainingDays >= 1) {
    return `البضائع الان في طريقها الى ليبيا، الوقت المتوقع وصوله في غضون ${remainingDays} ايام في حالة عدم حدوث اي تعطيلات خارجه عن الاراده`
  } else if (remainingDays === 0) {
    return `نتأسف على تاخير في الشحنه بسبب ظروف خارجه عن ارادتنا، انتظر منا رد غدا لمعرفة الموعد المتوقع للاستلام`;
  } else if (remainingDays >= -10) {
    return `نتأسف مجددا على التاخير الذي حدث في شحنتك، وذلك باسباب مثل تاخير في رحلات الدولية واجراءات الجمركية وغيرها، متوقع وصول بضائع في غضون ${11 - Math.abs(remainingDays)} ايام في حالة تاخرت اكثر من ذلك سيتم تقديم لك كوبون خصم حصري لك تعويضا على تاخير`;
  } else {
    return `نتأسف على التأخير الخارج عن ارادتنا عميلنا العزيز، قد يحدث تأخير في مسار الشحن ولكن لا تقلق شركة إكسيوس تقوم بالعمل لاخراج البضائع من الجمارك في اسرع وقت وعند وصوله وانهاء من الجرد سيتم التواصل معكم فورا للاستلام، شكرا لتفاهمكم`
  }
}
