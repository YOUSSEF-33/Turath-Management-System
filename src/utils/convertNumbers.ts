// utils/numberToWords.js

const ones = [
    "صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"
];

const teens = [
    "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر",
    "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"
];

const tens = [
    "", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون",
    "ستون", "سبعون", "ثمانون", "تسعون"
];

const hundreds = [
    "", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة",
    "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"
];

const thousands = ["", "ألف", "ألفان", "آلاف"];
const millions = ["", "مليون", "مليونان", "ملايين"];
const billions = ["", "مليار", "ملياران", "مليارات"];

const scales = [
    "", "ألف", "ألفًا", "آلاف", "مليون", "مليونًا", "ملايين",
    "مليار", "مليارًا", "مليارات"
];


export const convertToArabicWords = (num) => {
    if (num === 0) return "صفر";

    let words = [];

    // دالة لتحويل الرقم إلى نص
    const getThreeDigitWords = (n) => {
        let result = [];

        if (n >= 100) {
            result.push(hundreds[Math.floor(n / 100)]);
            n %= 100;
        }

        if (n >= 10 && n < 20) {
            result.push(teens[n - 10]);
        } else if (n >= 20) {
            let unit = n % 10;
            let ten = Math.floor(n / 10);
            if (unit > 0) {
                result.push(ones[unit]); // الوحدات أولًا
            }
            result.push(tens[ten]); // ثم العشرات
        } else if (n > 0) {
            result.push(ones[n]);
        }

        return result.join(" و ");
    };

    let numStr = num.toString();
    let numParts = [];

    // تقسيم الرقم إلى أجزاء من 3 خانات
    while (numStr.length > 0) {
        numParts.unshift(parseInt(numStr.slice(-3), 10));
        numStr = numStr.slice(0, -3);
    }

    let partsCount = numParts.length;

    numParts.forEach((part, index) => {
        if (part === 0) return;

        let partWords = getThreeDigitWords(part);
        let scaleIndex = (partsCount - index - 1) * 3;

        if (scaleIndex > 0) {
            if (part === 1) {
                partWords = scales[scaleIndex - 2]; // ألف، مليون، مليار
            } else if (part === 2) {
                partWords = scales[scaleIndex - 2] + "ان"; // ألفان، مليونان، ملياران
            } else if (part >= 3 && part <= 10) {
                partWords += " " + scales[scaleIndex]; // آلاف، ملايين، مليارات
            } else {
                partWords += " " + scales[scaleIndex - 1]; // ألفًا، مليونًا، مليارًا
            }
        }

        words.push(partWords);
    });

    return words.join(" و ");
};



// utils/numberConverter.js

const numberMap: any = {
    "صفر": 0, "واحد": 1, "اثنان": 2, "ثلاثة": 3, "أربعة": 4, "خمسة": 5, "ستة": 6, "سبعة": 7, "ثمانية": 8, "تسعة": 9,
    "عشرة": 10, "أحد عشر": 11, "اثنا عشر": 12, "ثلاثة عشر": 13, "أربعة عشر": 14, "خمسة عشر": 15, "ستة عشر": 16,
    "سبعة عشر": 17, "ثمانية عشر": 18, "تسعة عشر": 19, "عشرون": 20, "ثلاثون": 30, "أربعون": 40, "خمسون": 50,
    "ستون": 60, "سبعون": 70, "ثمانون": 80, "تسعون": 90, "مائة": 100, "مئتان": 200, "ثلاثمائة": 300, "أربعمائة": 400,
    "خمسمائة": 500, "ستمائة": 600, "سبعمائة": 700, "ثمانمائة": 800, "تسعمائة": 900, "ألف": 1000, "ألفان": 2000,
    "مليون": 1000000, "مليونان": 2000000, "مليار": 1000000000, "ملياران": 2000000000
};

const multipliers: any = { "ألف": 1000, "آلاف": 1000, "مليون": 1000000, "ملايين": 1000000, "مليار": 1000000000, "مليارات": 1000000000 };

const convertToNumber = (words: any) => {
    let tokens = words.split(" و ");
    let total = 0, current = 0;

    tokens.forEach(word => {
        if (numberMap[word] !== undefined) {
            current += numberMap[word];
        } else if (multipliers[word] !== undefined) {
            if (current === 0) current = 1;
            total += current * multipliers[word];
            current = 0;
        }
    });

    return total + current;
};

export { convertToNumber };

