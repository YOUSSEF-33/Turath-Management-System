import React from "react";

interface GeneratePDFProps {
    clientData: {
        name: string;
        phone: string;
        nationalId: string;
        address: string;
        email: string;
        contractDate: string;
        reservationDate: string;
    };
    unitDetails: {
        unit_number: string;
        unit_type: string;
        price: number;
        area: number;
        floor?: string;
        bedrooms: number;
        bathrooms: number;
        downPayment: number;
        monthlyInstallment: number;
        finalPrice: number;
        months: number;
        reservationDeposit: number;
        plan_images?: any[];
        gallery?: any[];
        building_id?: number;
    };
    attachments: {
        nationalIdCard?: any[];
        reservation_deposit_receipt?: any;
        attachments?: any[];
    };
    projectName?: string;
    buildingName?: string;
}

const convertToArabicWords = (number: number): string => {
    if (number === 0) return "صفر جنيه فقط لا غير";

    const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة",
        "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
    const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
    const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
    const thousands = ["", "ألف", "ألفان", "ثلاثة آلاف", "أربعة آلاف", "خمسة آلاف", "ستة آلاف", "سبعة آلاف", "ثمانية آلاف", "تسعة آلاف"];

    // Handle decimal part
    const roundedNumber = Math.round(number * 100) / 100;
    let intPart = Math.floor(roundedNumber);
    const decimalPart = Math.round((roundedNumber - intPart) * 100);

    let result = "";

    // Handle millions
    if (intPart >= 1000000) {
        const millions = Math.floor(intPart / 1000000);
        if (millions === 1) {
            result += "مليون ";
        } else if (millions === 2) {
            result += "مليونان ";
        } else if (millions >= 3 && millions <= 10) {
            result += ones[millions] + " ملايين ";
        } else {
            result += convertToArabicWords(millions) + " مليون ";
        }
        intPart = intPart % 1000000;
    }

    // Handle thousands
    if (intPart >= 1000) {
        const thousand = Math.floor(intPart / 1000);
        if (thousand === 1) {
            result += "ألف ";
        } else if (thousand === 2) {
            result += "ألفان ";
        } else if (thousand >= 3 && thousand <= 10) {
            result += ones[thousand] + " آلاف ";
        } else if (thousand > 10 && thousand < 20) {
            result += ones[thousand] + " ألف ";
        } else if (thousand >= 20 && thousand < 100) {
            const oneDigit = thousand % 10;
            const tenDigit = Math.floor(thousand / 10);
            if (oneDigit === 0) {
                result += tens[tenDigit] + " ألف ";
            } else {
                result += ones[oneDigit] + " و" + tens[tenDigit] + " ألف ";
            }
        } else if (thousand >= 100 && thousand < 1000) {
            const hundredDigit = Math.floor(thousand / 100);
            result += hundreds[hundredDigit] + " ";
            const remainingTens = thousand % 100;
            if (remainingTens > 0) {
                if (remainingTens < 20) {
                    result += ones[remainingTens] + " ألف ";
                } else {
                    const onesDigit = remainingTens % 10;
                    const tensDigit = Math.floor(remainingTens / 10);
                    if (onesDigit === 0) {
                        result += tens[tensDigit] + " ألف ";
                    } else {
                        result += ones[onesDigit] + " و" + tens[tensDigit] + " ألف ";
                    }
                }
            } else {
                result += "ألف ";
            }
        }
        intPart = intPart % 1000;
    }

    // Handle hundreds
    if (intPart >= 100) {
        const hundred = Math.floor(intPart / 100);
        result += hundreds[hundred] + " ";
        intPart = intPart % 100;
    }

    // Handle remaining number (less than 100)
    if (intPart > 0) {
        if (intPart < 20) {
            result += ones[intPart] + " ";
        } else {
            const onesDigit = intPart % 10;
            const tensDigit = Math.floor(intPart / 10);
            if (onesDigit === 0) {
                result += tens[tensDigit] + " ";
            } else {
                result += ones[onesDigit] + " و" + tens[tensDigit] + " ";
            }
        }
    }

    result += "جنيه ";

    if (decimalPart > 0) {
        result += "و";
        if (decimalPart < 20) {
            result += ones[decimalPart] + " ";
        } else {
            const onesDigit = decimalPart % 10;
            const tensDigit = Math.floor(decimalPart / 10);
            if (onesDigit === 0) {
                result += tens[tensDigit] + " ";
            } else {
                result += ones[onesDigit] + " و" + tens[tensDigit] + " ";
            }
        }
        result += "قرش ";
    }

    result += "فقط لا غير";

    return result;
};

export const GeneratePDF = (
    clientData: GeneratePDFProps["clientData"],
    unitDetails: GeneratePDFProps["unitDetails"],
    attachments: GeneratePDFProps["attachments"],
    projectName?: string,
    buildingName?: string,
) => {
    const finalPriceInWords = convertToArabicWords(unitDetails.finalPrice);
    const downPaymentInWords = convertToArabicWords(unitDetails.downPayment);
    const reservationDepositInWords = convertToArabicWords(unitDetails.reservationDeposit);
    const monthlyInstallmentInWords = convertToArabicWords(unitDetails.monthlyInstallment);

    const contractHtml = `
       
                <div class='container'>
                    <div class='page-content'>
                        <div class='content-area'>
                            <div class='header'>
                                <img src="/path/to/logo.png" class='logo' alt="Company Logo" />
                            </div>
                            <div class="date-section">
                                <div>تاريخ الحجز: ${clientData.reservationDate}</div>
                                <div>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}</div>
                            </div>
                            <h2 class='section-header'>بيانات العميل</h2>
                            <div class="grid-container">
                                <div class='data-row'>
                                    <div class='label'>اسم العميل</div>
                                    <div class='value'>${clientData.name}</div>
                                </div>
                                <div class='data-row'>
                                    <div class='label'>رقم الهاتف</div>
                                    <div class='value'>${clientData.phone}</div>
                                </div>
                                <div class='data-row'>
                                    <div class='label'>الرقم القومي</div>
                                    <div class='value'>${clientData.nationalId}</div>
                                </div>
                                <div class='data-row'>
                                    <div class='label'>العنوان</div>
                                    <div class='value'>${clientData.address}</div>
                                </div>
                                <div class='data-row'>
                                    <div class='label'>البريد الإلكتروني</div>
                                    <div class='value'>${clientData.email || '-'}</div>
                                </div>
                                <div class='data-row'>
                                    <div class='label'>تاريخ التعاقد</div>
                                    <div class='value'>${clientData.contractDate}</div>
                                </div>
                            </div>
                            <h2 class='section-header'>بيانات الوحدة</h2>
                            <div class="grid-container">
                                
                                <div class='data-row'>
                                    <div class='label'>رمز الوحدة</div>
                                    <div class='value'>${unitDetails.unit_number}</div>
                                </div>
                                <div class='data-row'>
                                    <div class='label'>نوع الوحدة</div>
                                    <div class='value'>${unitDetails.unit_type}</div>
                                </div>
                                <div class='data-row'>
                                    <div class='label'>المساحة</div>
                                    <div class='value'>${unitDetails.area} م²</div>
                                </div>
                                <div class='data-row'>
                                    <div class='label'>الطابق</div>
                                    <div class='value'>${unitDetails.floor || '-'}</div>
                                </div>
                            </div>
                            <h2 class='section-header'>بيانات السداد</h2>
                            <div class="amount-row">
                                <div class="amount-value">
                                    <div class="amount-group">
                                        <div class="amount-sublabel">السعر النهائي بالأرقام</div>
                                        <div class="amount-number">${unitDetails.finalPrice} جنيه</div>
                                    </div>
                                    <div class="amount-group">
                                        <div class="amount-sublabel">السعر النهائي بالحروف</div>
                                        <div class="amount-text">${finalPriceInWords}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="amount-row">
                                <div class="amount-value">
                                    <div class="amount-group">
                                        <div class="amount-sublabel">مبلغ الحجز بالأرقام</div>
                                        <div class="amount-number">${unitDetails.reservationDeposit} جنيه</div>
                                    </div>
                                    <div class="amount-group">
                                        <div class="amount-sublabel">مبلغ الحجز بالحروف</div>
                                        <div class="amount-text">${reservationDepositInWords}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="amount-row">
                                <div class="amount-value">
                                    <div class="amount-group">
                                        <div class="amount-sublabel">الدفعة المقدمة بالأرقام</div>
                                        <div class="amount-number">${unitDetails.downPayment} جنيه</div>
                                    </div>
                                    <div class="amount-group">
                                        <div class="amount-sublabel">الدفعة المقدمة بالحروف</div>
                                        <div class="amount-text">${downPaymentInWords}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="amount-row">
                                <div class="amount-value">
                                    <div class="amount-group">
                                        <div class="amount-sublabel">القسط الشهري بالأرقام</div>
                                        <div class="amount-number">${unitDetails.monthlyInstallment} جنيه</div>
                                    </div>
                                    <div class="amount-group">
                                        <div class="amount-sublabel">القسط الشهري بالحروف</div>
                                        <div class="amount-text">${monthlyInstallmentInWords}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="amount-row">
                                <div class="amount-value">
                                    <div class="amount-group">
                                        <div class="amount-sublabel">عدد الشهور بالأرقام</div>
                                        <div class="amount-number">${unitDetails.months} شهر</div>
                                    </div>
                                </div>
                            </div>
                            <h2 class='section-header'>شروط الحجز</h2>
                            <div class="terms">
                                <p>% يتم التوقيع على العقد خلال المدة المتفق عليها في الاستمارة وفي حالة عدم إتمام التعاقد خلال تلك المدة بخصم 50 من قيمة إستمارة الحجز دون الحاجة إلى أي تنبيه او استفسار بكم فقدان.</p>
                                <p>لا يوجد أي حقوق للعميل في الوحدة المحجوزة إلا بعد إتمام التعاقد.</p>
                            </div>
                            <div class='signatures'>
                                <div class='signature-row'>
                                    <div class='signature-block'>
                                        <p class='signature-title'>مدير المبيعات</p>
                                        <span class='signature-line'></span>
                                    </div>
                                    <div class='signature-block'>
                                        <p class='signature-title'>مسؤول الحجز</p>
                                        <span class='signature-line'></span>
                                    </div>
                                    <div class='signature-block'>
                                        <p class='signature-title'>توقيع العميل</p>
                                        <span class='signature-line'></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    `;

    const generateImagePages = (images: any[], title: string) => {
        //if (!images || images.length === 0) return "";

        return `
            <div style="page-break-before: always;">
                <h1 style="text-align: center; color: #002D62; margin-bottom: 20px;">${title}</h1>
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${images
                        .map(
                            (img, index) => `
                        <div class="image-container" style="border: 1px solid #ccc; padding: 10px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
                            <img src="${img.url || img.uri}" 
                                 style="max-width: 100%; height: auto; max-height: 400px; border-radius: 5px; object-fit: contain;" 
                                 alt="${img.name || `صورة ${index + 1}`}"
                            />
                            <p style="text-align: center; margin-top: 10px; color: #000; font-size: 14px;">
                                ${img.name || `صورة ${index + 1}`}
                            </p>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            </div>
        `;
    };

    // Generate HTML for all attachments
    const nationalIdImagesHtml = generateImagePages(attachments.nationalIdCard || [], "صور البطاقة الشخصية");
    const planImagesHtml = generateImagePages(unitDetails.plan_images || [], "مخططات الوحدة");
    const galleryImagesHtml = generateImagePages(unitDetails.gallery || [], "صور الوحدة");
    const additionalAttachmentsHtml = generateImagePages(attachments.attachments || [], "المرفقات الإضافية");

    // Combine all HTML content
    const fullHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: 'Arial, sans-serif';
                        direction: rtl;
                        background-color: #fff;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 800px;
                        min-height: 900px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        padding: 6px;
                        margin: 0 auto;
                        position: relative;
                    }
                    .page-content {
                        min-height: 880px;
                        display: flex;
                        flex-direction: column;
                    }
                    .content-area {
                        flex-grow: 1;
                    }
                    .section-header {
                        font-size: 16px;
                        color: #2c3e50;
                        margin-bottom: 3px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 3px;
                    }
                    .data-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 1px;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        background: #ffffff;
                    }
                    .label {
                        width: 100px;
                        padding: 6px 8px;
                        border-left: 1px solid #e0e0e0;
                        color: #000;
                        font-size: 12px;
                        background: #f8f9fa;
                        font-weight: bold;
                    }
                    .value {
                        flex: 1;
                        padding: 6px 8px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 4px;
                    }
                    .logo {
                        max-width: 100px;
                        height: auto;
                        margin-bottom: 6px;
                    }
                    .signatures {
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 2px solid #e0e0e0;
                        page-break-inside: avoid;
                    }
                    .signature-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .signature-block {
                        width: 30%;
                        text-align: center;
                        margin-bottom: 5px;
                    }
                    .signature-title {
                        color: #000;
                        font-size: 14px;
                        margin-bottom: 4px;
                    }
                    .signature-line {
                        display: block;
                        width: 90%;
                        margin: 4px auto;
                        border-bottom: 1px solid #000;
                    }
                    .date-section {
                        text-align: left;
                        color: #000;
                        margin-bottom: 8px;
                        font-size: 14px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .grid-container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        margin-bottom: 8px;
                    }
                    .compact-section {
                        margin-bottom: 8px;
                    }
                    .terms {
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .amount-row {
                        display: flex;
                        flex-direction: column;
                        margin-bottom: 2px;
                        background: #f8f9fa;
                        border-radius: 6px;
                        padding: 6px;
                    }
                    .amount-label {
                        width: 100%;
                        font-size: 14px;
                        font-weight: bold;
                        color: #000;
                        margin-bottom: 4px;
                    }
                    .amount-value {
                        display: flex;
                        gap: 8px;
                    }
                    .amount-group {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    }
                    .amount-sublabel {
                        font-size: 12px;
                        color: #666;
                        margin-bottom: 2px;
                    }
                    .amount-number, .amount-text {
                        font-size: 14px;
                        color: #000;
                        background: #fff;
                        padding: 6px;
                        border-radius: 4px;
                        border: 1px solid #e0e0e0;
                    }
                    .amount-number {
                        text-align: center;
                    }
                    @media print {
                        body { margin: 0 !important; padding: 0 !important; }
                        .container { padding: 3mm !important; }
                        .data-row { margin-bottom: 0.2mm !important; }
                        .section-header { margin-bottom: 1.5mm !important; font-size: 16px !important; }
                        .label { font-size: 12px !important; padding: 3px 6px !important; }
                        .value { font-size: 12px !important; padding: 3px 6px !important; }
                        .signature-title { font-size: 12px !important; }
                        .compact-section { margin-bottom: 2mm !important; }
                        .terms { font-size: 10px !important; line-height: 1.1 !important; }
                        .amount-number, .amount-text { font-size: 12px !important; }
                        .amount-sublabel { font-size: 10px !important; }
                    }
                </style>
            </head>
            <body>
                ${contractHtml}
                ${nationalIdImagesHtml}
                ${planImagesHtml}
                ${galleryImagesHtml}
                ${additionalAttachmentsHtml}
            </body>
        </html>
    `;

    // Open a new window and print the content
    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.print();
    }

   
};


