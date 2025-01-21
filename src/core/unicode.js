/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getLookupTableFactory } from "./core_utils.js";

// Some characters, e.g. copyrightserif, are mapped to the private use area
// and might not be displayed using standard fonts. Mapping/hacking well-known
// chars to the similar equivalents in the normal characters range.
const getSpecialPUASymbols = getLookupTableFactory(function (t) {
  t[63721] = 0x00a9; // copyrightsans (0xF8E9) => copyright
  t[63193] = 0x00a9; // copyrightserif (0xF6D9) => copyright
  t[63720] = 0x00ae; // registersans (0xF8E8) => registered
  t[63194] = 0x00ae; // registerserif (0xF6DA) => registered
  t[63722] = 0x2122; // trademarksans (0xF8EA) => trademark
  t[63195] = 0x2122; // trademarkserif (0xF6DB) => trademark
  t[63729] = 0x23a7; // bracelefttp (0xF8F1)
  t[63730] = 0x23a8; // braceleftmid (0xF8F2)
  t[63731] = 0x23a9; // braceleftbt (0xF8F3)
  t[63740] = 0x23ab; // bracerighttp (0xF8FC)
  t[63741] = 0x23ac; // bracerightmid (0xF8FD)
  t[63742] = 0x23ad; // bracerightbt (0xF8FE)
  t[63726] = 0x23a1; // bracketlefttp (0xF8EE)
  t[63727] = 0x23a2; // bracketleftex (0xF8EF)
  t[63728] = 0x23a3; // bracketleftbt (0xF8F0)
  t[63737] = 0x23a4; // bracketrighttp (0xF8F9)
  t[63738] = 0x23a5; // bracketrightex (0xF8FA)
  t[63739] = 0x23a6; // bracketrightbt (0xF8FB)
  t[63723] = 0x239b; // parenlefttp (0xF8EB)
  t[63724] = 0x239c; // parenleftex (0xF8EC)
  t[63725] = 0x239d; // parenleftbt (0xF8ED)
  t[63734] = 0x239e; // parenrighttp (0xF8F6)
  t[63735] = 0x239f; // parenrightex (0xF8F7)
  t[63736] = 0x23a0; // parenrightbt (0xF8F8)
});

function mapSpecialUnicodeValues(code) {
  if (code >= 0xfff0 && code <= 0xffff) {
    // Specials unicode block.
    return 0;
  } else if (code >= 0xf600 && code <= 0xf8ff) {
    return getSpecialPUASymbols()[code] || code;
  } else if (code === /* softhyphen = */ 0x00ad) {
    return 0x002d; // hyphen
  }
  return code;
}

function getUnicodeForGlyph(name, glyphsUnicodeMap) {
  let unicode = glyphsUnicodeMap[name];
  if (unicode !== undefined) {
    return unicode;
  }
  if (!name) {
    return -1;
  }
  // Try to recover valid Unicode values from 'uniXXXX'/'uXXXX{XX}' glyphs.
  if (name[0] === "u") {
    const nameLen = name.length;
    let hexStr;

    if (nameLen === 7 && name[1] === "n" && name[2] === "i") {
      // 'uniXXXX'
      hexStr = name.substring(3);
    } else if (nameLen >= 5 && nameLen <= 7) {
      // 'uXXXX{XX}'
      hexStr = name.substring(1);
    } else {
      return -1;
    }
    // Check for upper-case hexadecimal characters, to avoid false positives.
    if (hexStr === hexStr.toUpperCase()) {
      unicode = parseInt(hexStr, 16);
      if (unicode >= 0) {
        return unicode;
      }
    }
  }
  return -1;
}

// See https://learn.microsoft.com/en-us/typography/opentype/spec/os2#ulunicoderange1-bits-031ulunicoderange2-bits-3263ulunicoderange3-bits-6495ulunicoderange4-bits-96127
const UnicodeRanges = [
  [0x0000, 0x007f], // 0 - Basic Latin
  [0x0080, 0x00ff], // 1 - Latin-1 Supplement
  [0x0100, 0x017f], // 2 - Latin Extended-A
  [0x0180, 0x024f], // 3 - Latin Extended-B
  [0x0250, 0x02af, 0x1d00, 0x1d7f, 0x1d80, 0x1dbf], // 4 - IPA Extensions - Phonetic Extensions - Phonetic Extensions Supplement
  [0x02b0, 0x02ff, 0xa700, 0xa71f], // 5 - Spacing Modifier Letters - Modifier Tone Letters
  [0x0300, 0x036f, 0x1dc0, 0x1dff], // 6 - Combining Diacritical Marks - Combining Diacritical Marks Supplement
  [0x0370, 0x03ff], // 7 - Greek and Coptic
  [0x2c80, 0x2cff], // 8 - Coptic
  [0x0400, 0x04ff, 0x0500, 0x052f, 0x2de0, 0x2dff, 0xa640, 0xa69f], // 9 - Cyrillic - Cyrillic Supplement - Cyrillic Extended-A - Cyrillic Extended-B
  [0x0530, 0x058f], // 10 - Armenian
  [0x0590, 0x05ff], // 11 - Hebrew
  [0xa500, 0xa63f], // 12 - Vai
  [0x0600, 0x06ff, 0x0750, 0x077f], // 13 - Arabic - Arabic Supplement
  [0x07c0, 0x07ff], // 14 - NKo
  [0x0900, 0x097f], // 15 - Devanagari
  [0x0980, 0x09ff], // 16 - Bengali
  [0x0a00, 0x0a7f], // 17 - Gurmukhi
  [0x0a80, 0x0aff], // 18 - Gujarati
  [0x0b00, 0x0b7f], // 19 - Oriya
  [0x0b80, 0x0bff], // 20 - Tamil
  [0x0c00, 0x0c7f], // 21 - Telugu
  [0x0c80, 0x0cff], // 22 - Kannada
  [0x0d00, 0x0d7f], // 23 - Malayalam
  [0x0e00, 0x0e7f], // 24 - Thai
  [0x0e80, 0x0eff], // 25 - Lao
  [0x10a0, 0x10ff, 0x2d00, 0x2d2f], // 26 - Georgian - Georgian Supplement
  [0x1b00, 0x1b7f], // 27 - Balinese
  [0x1100, 0x11ff], // 28 - Hangul Jamo
  [0x1e00, 0x1eff, 0x2c60, 0x2c7f, 0xa720, 0xa7ff], // 29 - Latin Extended Additional - Latin Extended-C - Latin Extended-D
  [0x1f00, 0x1fff], // 30 - Greek Extended
  [0x2000, 0x206f, 0x2e00, 0x2e7f], // 31 - General Punctuation - Supplemental Punctuation
  [0x2070, 0x209f], // 32 - Superscripts And Subscripts
  [0x20a0, 0x20cf], // 33 - Currency Symbol
  [0x20d0, 0x20ff], // 34 - Combining Diacritical Marks
  [0x2100, 0x214f], // 35 - Letterlike Symbols
  [0x2150, 0x218f], // 36 - Number Forms
  [0x2190, 0x21ff, 0x27f0, 0x27ff, 0x2900, 0x297f, 0x2b00, 0x2bff], // 37 - Arrows - Supplemental Arrows-A - Supplemental Arrows-B - Miscellaneous Symbols and Arrows
  [0x2200, 0x22ff, 0x2a00, 0x2aff, 0x27c0, 0x27ef, 0x2980, 0x29ff], // 38 - Mathematical Operators - Supplemental Mathematical Operators - Miscellaneous Mathematical Symbols-A - Miscellaneous Mathematical Symbols-B
  [0x2300, 0x23ff], // 39 - Miscellaneous Technical
  [0x2400, 0x243f], // 40 - Control Pictures
  [0x2440, 0x245f], // 41 - Optical Character Recognition
  [0x2460, 0x24ff], // 42 - Enclosed Alphanumerics
  [0x2500, 0x257f], // 43 - Box Drawing
  [0x2580, 0x259f], // 44 - Block Elements
  [0x25a0, 0x25ff], // 45 - Geometric Shapes
  [0x2600, 0x26ff], // 46 - Miscellaneous Symbols
  [0x2700, 0x27bf], // 47 - Dingbats
  [0x3000, 0x303f], // 48 - CJK Symbols And Punctuation
  [0x3040, 0x309f], // 49 - Hiragana
  [0x30a0, 0x30ff, 0x31f0, 0x31ff], // 50 - Katakana - Katakana Phonetic Extensions
  [0x3100, 0x312f, 0x31a0, 0x31bf], // 51 - Bopomofo - Bopomofo Extended
  [0x3130, 0x318f], // 52 - Hangul Compatibility Jamo
  [0xa840, 0xa87f], // 53 - Phags-pa
  [0x3200, 0x32ff], // 54 - Enclosed CJK Letters And Months
  [0x3300, 0x33ff], // 55 - CJK Compatibility
  [0xac00, 0xd7af], // 56 - Hangul Syllables
  [0xd800, 0xdfff], // 57 - Non-Plane 0 *
  [0x10900, 0x1091f], // 58 - Phoenicia
  [
    0x4e00, 0x9fff, 0x2e80, 0x2eff, 0x2f00, 0x2fdf, 0x2ff0, 0x2fff, 0x3400,
    0x4dbf, 0x20000, 0x2a6df, 0x3190, 0x319f,
  ], // 59 - CJK Unified Ideographs - CJK Radicals Supplement - Kangxi Radicals - Ideographic Description Characters - CJK Unified Ideographs Extension A - CJK Unified Ideographs Extension B - Kanbun
  [0xe000, 0xf8ff], // 60 - Private Use Area (plane 0)
  [0x31c0, 0x31ef, 0xf900, 0xfaff, 0x2f800, 0x2fa1f], // 61 - CJK Strokes - CJK Compatibility Ideographs - CJK Compatibility Ideographs Supplement
  [0xfb00, 0xfb4f], // 62 - Alphabetic Presentation Forms
  [0xfb50, 0xfdff], // 63 - Arabic Presentation Forms-A
  [0xfe20, 0xfe2f], // 64 - Combining Half Marks
  [0xfe10, 0xfe1f], // 65 - Vertical Forms
  [0xfe50, 0xfe6f], // 66 - Small Form Variants
  [0xfe70, 0xfeff], // 67 - Arabic Presentation Forms-B
  [0xff00, 0xffef], // 68 - Halfwidth And Fullwidth Forms
  [0xfff0, 0xffff], // 69 - Specials
  [0x0f00, 0x0fff], // 70 - Tibetan
  [0x0700, 0x074f], // 71 - Syriac
  [0x0780, 0x07bf], // 72 - Thaana
  [0x0d80, 0x0dff], // 73 - Sinhala
  [0x1000, 0x109f], // 74 - Myanmar
  [0x1200, 0x137f, 0x1380, 0x139f, 0x2d80, 0x2ddf], // 75 - Ethiopic - Ethiopic Supplement - Ethiopic Extended
  [0x13a0, 0x13ff], // 76 - Cherokee
  [0x1400, 0x167f], // 77 - Unified Canadian Aboriginal Syllabics
  [0x1680, 0x169f], // 78 - Ogham
  [0x16a0, 0x16ff], // 79 - Runic
  [0x1780, 0x17ff], // 80 - Khmer
  [0x1800, 0x18af], // 81 - Mongolian
  [0x2800, 0x28ff], // 82 - Braille Patterns
  [0xa000, 0xa48f], // 83 - Yi Syllables
  [0x1700, 0x171f, 0x1720, 0x173f, 0x1740, 0x175f, 0x1760, 0x177f], // 84 - Tagalog - Hanunoo - Buhid - Tagbanwa
  [0x10300, 0x1032f], // 85 - Old Italic
  [0x10330, 0x1034f], // 86 - Gothic
  [0x10400, 0x1044f], // 87 - Deseret
  [0x1d000, 0x1d0ff, 0x1d100, 0x1d1ff, 0x1d200, 0x1d24f], // 88 - Byzantine Musical Symbols - Musical Symbols - Ancient Greek Musical Notation
  [0x1d400, 0x1d7ff], // 89 - Mathematical Alphanumeric Symbols
  [0xff000, 0xffffd], // 90 - Private Use (plane 15)
  [0xfe00, 0xfe0f, 0xe0100, 0xe01ef], // 91 - Variation Selectors - Variation Selectors Supplement
  [0xe0000, 0xe007f], // 92 - Tags
  [0x1900, 0x194f], // 93 - Limbu
  [0x1950, 0x197f], // 94 - Tai Le
  [0x1980, 0x19df], // 95 - New Tai Lue
  [0x1a00, 0x1a1f], // 96 - Buginese
  [0x2c00, 0x2c5f], // 97 - Glagolitic
  [0x2d30, 0x2d7f], // 98 - Tifinagh
  [0x4dc0, 0x4dff], // 99 - Yijing Hexagram Symbols
  [0xa800, 0xa82f], // 100 - Syloti Nagri
  [0x10000, 0x1007f, 0x10080, 0x100ff, 0x10100, 0x1013f], // 101 - Linear B Syllabary - Linear B Ideograms - Aegean Numbers
  [0x10140, 0x1018f], // 102 - Ancient Greek Numbers
  [0x10380, 0x1039f], // 103 - Ugaritic
  [0x103a0, 0x103df], // 104 - Old Persian
  [0x10450, 0x1047f], // 105 - Shavian
  [0x10480, 0x104af], // 106 - Osmanya
  [0x10800, 0x1083f], // 107 - Cypriot Syllabary
  [0x10a00, 0x10a5f], // 108 - Kharoshthi
  [0x1d300, 0x1d35f], // 109 - Tai Xuan Jing Symbols
  [0x12000, 0x123ff, 0x12400, 0x1247f], // 110 - Cuneiform - Cuneiform Numbers and Punctuation
  [0x1d360, 0x1d37f], // 111 - Counting Rod Numerals
  [0x1b80, 0x1bbf], // 112 - Sundanese
  [0x1c00, 0x1c4f], // 113 - Lepcha
  [0x1c50, 0x1c7f], // 114 - Ol Chiki
  [0xa880, 0xa8df], // 115 - Saurashtra
  [0xa900, 0xa92f], // 116 - Kayah Li
  [0xa930, 0xa95f], // 117 - Rejang
  [0xaa00, 0xaa5f], // 118 - Cham
  [0x10190, 0x101cf], // 119 - Ancient Symbols
  [0x101d0, 0x101ff], // 120 - Phaistos Disc
  [0x102a0, 0x102df, 0x10280, 0x1029f, 0x10920, 0x1093f], // 121 - Carian - Lycian - Lydian
  [0x1f030, 0x1f09f, 0x1f000, 0x1f02f], // 122 - Domino Tiles - Mahjong Tiles
];

function getUnicodeRangeFor(value, lastPosition = -1) {
  // TODO: create a map range => position, sort the ranges and cache it.
  // Then we can make a binary search for finding a range for a given unicode.
  if (lastPosition !== -1) {
    const range = UnicodeRanges[lastPosition];
    for (let i = 0, ii = range.length; i < ii; i += 2) {
      if (value >= range[i] && value <= range[i + 1]) {
        return lastPosition;
      }
    }
  }
  for (let i = 0, ii = UnicodeRanges.length; i < ii; i++) {
    const range = UnicodeRanges[i];
    for (let j = 0, jj = range.length; j < jj; j += 2) {
      if (value >= range[j] && value <= range[j + 1]) {
        return i;
      }
    }
  }
  return -1;
}
// eslint-disable-next-line prettier/prettier
const whitespace = ["\u0009", "\u000a", "\u000b", "\u000c", "\u000d", "\u0020", "\u00a0", "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200a", "\u2028", "\u2029", "\u202f", "\u205f", "\u3000", "\ufeff"];
// eslint-disable-next-line prettier/prettier, max-len
const zeroWidthDiacritic = ["\u0300", "\u0301", "\u0302", "\u0303", "\u0304", "\u0305", "\u0306", "\u0307", "\u0308", "\u0309", "\u030a", "\u030b", "\u030c", "\u030d", "\u030e", "\u030f", "\u0310", "\u0311", "\u0312", "\u0313", "\u0314", "\u0315", "\u0316", "\u0317", "\u0318", "\u0319", "\u031a", "\u031b", "\u031c", "\u031d", "\u031e", "\u031f", "\u0320", "\u0321", "\u0322", "\u0323", "\u0324", "\u0325", "\u0326", "\u0327", "\u0328", "\u0329", "\u032a", "\u032b", "\u032c", "\u032d", "\u032e", "\u032f", "\u0330", "\u0331", "\u0332", "\u0333", "\u0334", "\u0335", "\u0336", "\u0337", "\u0338", "\u0339", "\u033a", "\u033b", "\u033c", "\u033d", "\u033e", "\u033f", "\u0340", "\u0341", "\u0342", "\u0343", "\u0344", "\u0345", "\u0346", "\u0347", "\u0348", "\u0349", "\u034a", "\u034b", "\u034c", "\u034d", "\u034e", "\u034f", "\u0350", "\u0351", "\u0352", "\u0353", "\u0354", "\u0355", "\u0356", "\u0357", "\u0358", "\u0359", "\u035a", "\u035b", "\u035c", "\u035d", "\u035e", "\u035f", "\u0360", "\u0361", "\u0362", "\u0363", "\u0364", "\u0365", "\u0366", "\u0367", "\u0368", "\u0369", "\u036a", "\u036b", "\u036c", "\u036d", "\u036e", "\u036f", "\u0483", "\u0484", "\u0485", "\u0486", "\u0487", "\u0591", "\u0592", "\u0593", "\u0594", "\u0595", "\u0596", "\u0597", "\u0598", "\u0599", "\u059a", "\u059b", "\u059c", "\u059d", "\u059e", "\u059f", "\u05a0", "\u05a1", "\u05a2", "\u05a3", "\u05a4", "\u05a5", "\u05a6", "\u05a7", "\u05a8", "\u05a9", "\u05aa", "\u05ab", "\u05ac", "\u05ad", "\u05ae", "\u05af", "\u05b0", "\u05b1", "\u05b2", "\u05b3", "\u05b4", "\u05b5", "\u05b6", "\u05b7", "\u05b8", "\u05b9", "\u05ba", "\u05bb", "\u05bc", "\u05bd", "\u05bf", "\u05c1", "\u05c2", "\u05c4", "\u05c5", "\u05c7", "\u0610", "\u0611", "\u0612", "\u0613", "\u0614", "\u0615", "\u0616", "\u0617", "\u0618", "\u0619", "\u061a", "\u064b", "\u064c", "\u064d", "\u064e", "\u064f", "\u0650", "\u0651", "\u0652", "\u0653", "\u0654", "\u0655", "\u0656", "\u0657", "\u0658", "\u0659", "\u065a", "\u065b", "\u065c", "\u065d", "\u065e", "\u065f", "\u0670", "\u06d6", "\u06d7", "\u06d8", "\u06d9", "\u06da", "\u06db", "\u06dc", "\u06df", "\u06e0", "\u06e1", "\u06e2", "\u06e3", "\u06e4", "\u06e7", "\u06e8", "\u06ea", "\u06eb", "\u06ec", "\u06ed", "\u0711", "\u0730", "\u0731", "\u0732", "\u0733", "\u0734", "\u0735", "\u0736", "\u0737", "\u0738", "\u0739", "\u073a", "\u073b", "\u073c", "\u073d", "\u073e", "\u073f", "\u0740", "\u0741", "\u0742", "\u0743", "\u0744", "\u0745", "\u0746", "\u0747", "\u0748", "\u0749", "\u074a", "\u07a6", "\u07a7", "\u07a8", "\u07a9", "\u07aa", "\u07ab", "\u07ac", "\u07ad", "\u07ae", "\u07af", "\u07b0", "\u07eb", "\u07ec", "\u07ed", "\u07ee", "\u07ef", "\u07f0", "\u07f1", "\u07f2", "\u07f3", "\u07fd", "\u0816", "\u0817", "\u0818", "\u0819", "\u081b", "\u081c", "\u081d", "\u081e", "\u081f", "\u0820", "\u0821", "\u0822", "\u0823", "\u0825", "\u0826", "\u0827", "\u0829", "\u082a", "\u082b", "\u082c", "\u082d", "\u0859", "\u085a", "\u085b", "\u0898", "\u0899", "\u089a", "\u089b", "\u089c", "\u089d", "\u089e", "\u089f", "\u08ca", "\u08cb", "\u08cc", "\u08cd", "\u08ce", "\u08cf", "\u08d0", "\u08d1", "\u08d2", "\u08d3", "\u08d4", "\u08d5", "\u08d6", "\u08d7", "\u08d8", "\u08d9", "\u08da", "\u08db", "\u08dc", "\u08dd", "\u08de", "\u08df", "\u08e0", "\u08e1", "\u08e3", "\u08e4", "\u08e5", "\u08e6", "\u08e7", "\u08e8", "\u08e9", "\u08ea", "\u08eb", "\u08ec", "\u08ed", "\u08ee", "\u08ef", "\u08f0", "\u08f1", "\u08f2", "\u08f3", "\u08f4", "\u08f5", "\u08f6", "\u08f7", "\u08f8", "\u08f9", "\u08fa", "\u08fb", "\u08fc", "\u08fd", "\u08fe", "\u08ff", "\u0900", "\u0901", "\u0902", "\u093a", "\u093c", "\u0941", "\u0942", "\u0943", "\u0944", "\u0945", "\u0946", "\u0947", "\u0948", "\u094d", "\u0951", "\u0952", "\u0953", "\u0954", "\u0955", "\u0956", "\u0957", "\u0962", "\u0963", "\u0981", "\u09bc", "\u09c1", "\u09c2", "\u09c3", "\u09c4", "\u09cd", "\u09e2", "\u09e3", "\u09fe", "\u0a01", "\u0a02", "\u0a3c", "\u0a41", "\u0a42", "\u0a47", "\u0a48", "\u0a4b", "\u0a4c", "\u0a4d", "\u0a51", "\u0a70", "\u0a71", "\u0a75", "\u0a81", "\u0a82", "\u0abc", "\u0ac1", "\u0ac2", "\u0ac3", "\u0ac4", "\u0ac5", "\u0ac7", "\u0ac8", "\u0acd", "\u0ae2", "\u0ae3", "\u0afa", "\u0afb", "\u0afc", "\u0afd", "\u0afe", "\u0aff", "\u0b01", "\u0b3c", "\u0b3f", "\u0b41", "\u0b42", "\u0b43", "\u0b44", "\u0b4d", "\u0b55", "\u0b56", "\u0b62", "\u0b63", "\u0b82", "\u0bc0", "\u0bcd", "\u0c00", "\u0c04", "\u0c3c", "\u0c3e", "\u0c3f", "\u0c40", "\u0c46", "\u0c47", "\u0c48", "\u0c4a", "\u0c4b", "\u0c4c", "\u0c4d", "\u0c55", "\u0c56", "\u0c62", "\u0c63", "\u0c81", "\u0cbc", "\u0cbf", "\u0cc6", "\u0ccc", "\u0ccd", "\u0ce2", "\u0ce3", "\u0d00", "\u0d01", "\u0d3b", "\u0d3c", "\u0d41", "\u0d42", "\u0d43", "\u0d44", "\u0d4d", "\u0d62", "\u0d63", "\u0d81", "\u0dca", "\u0dd2", "\u0dd3", "\u0dd4", "\u0dd6", "\u0e31", "\u0e34", "\u0e35", "\u0e36", "\u0e37", "\u0e38", "\u0e39", "\u0e3a", "\u0e47", "\u0e48", "\u0e49", "\u0e4a", "\u0e4b", "\u0e4c", "\u0e4d", "\u0e4e", "\u0eb1", "\u0eb4", "\u0eb5", "\u0eb6", "\u0eb7", "\u0eb8", "\u0eb9", "\u0eba", "\u0ebb", "\u0ebc", "\u0ec8", "\u0ec9", "\u0eca", "\u0ecb", "\u0ecc", "\u0ecd", "\u0ece", "\u0f18", "\u0f19", "\u0f35", "\u0f37", "\u0f39", "\u0f71", "\u0f72", "\u0f73", "\u0f74", "\u0f75", "\u0f76", "\u0f77", "\u0f78", "\u0f79", "\u0f7a", "\u0f7b", "\u0f7c", "\u0f7d", "\u0f7e", "\u0f80", "\u0f81", "\u0f82", "\u0f83", "\u0f84", "\u0f86", "\u0f87", "\u0f8d", "\u0f8e", "\u0f8f", "\u0f90", "\u0f91", "\u0f92", "\u0f93", "\u0f94", "\u0f95", "\u0f96", "\u0f97", "\u0f99", "\u0f9a", "\u0f9b", "\u0f9c", "\u0f9d", "\u0f9e", "\u0f9f", "\u0fa0", "\u0fa1", "\u0fa2", "\u0fa3", "\u0fa4", "\u0fa5", "\u0fa6", "\u0fa7", "\u0fa8", "\u0fa9", "\u0faa", "\u0fab", "\u0fac", "\u0fad", "\u0fae", "\u0faf", "\u0fb0", "\u0fb1", "\u0fb2", "\u0fb3", "\u0fb4", "\u0fb5", "\u0fb6", "\u0fb7", "\u0fb8", "\u0fb9", "\u0fba", "\u0fbb", "\u0fbc", "\u0fc6", "\u102d", "\u102e", "\u102f", "\u1030", "\u1032", "\u1033", "\u1034", "\u1035", "\u1036", "\u1037", "\u1039", "\u103a", "\u103d", "\u103e", "\u1058", "\u1059", "\u105e", "\u105f", "\u1060", "\u1071", "\u1072", "\u1073", "\u1074", "\u1082", "\u1085", "\u1086", "\u108d", "\u109d", "\u135d", "\u135e", "\u135f", "\u1712", "\u1713", "\u1714", "\u1732", "\u1733", "\u1752", "\u1753", "\u1772", "\u1773", "\u17b4", "\u17b5", "\u17b7", "\u17b8", "\u17b9", "\u17ba", "\u17bb", "\u17bc", "\u17bd", "\u17c6", "\u17c9", "\u17ca", "\u17cb", "\u17cc", "\u17cd", "\u17ce", "\u17cf", "\u17d0", "\u17d1", "\u17d2", "\u17d3", "\u17dd", "\u180b", "\u180c", "\u180d", "\u180f", "\u1885", "\u1886", "\u18a9", "\u1920", "\u1921", "\u1922", "\u1927", "\u1928", "\u1932", "\u1939", "\u193a", "\u193b", "\u1a17", "\u1a18", "\u1a1b", "\u1a56", "\u1a58", "\u1a59", "\u1a5a", "\u1a5b", "\u1a5c", "\u1a5d", "\u1a5e", "\u1a60", "\u1a62", "\u1a65", "\u1a66", "\u1a67", "\u1a68", "\u1a69", "\u1a6a", "\u1a6b", "\u1a6c", "\u1a73", "\u1a74", "\u1a75", "\u1a76", "\u1a77", "\u1a78", "\u1a79", "\u1a7a", "\u1a7b", "\u1a7c", "\u1a7f", "\u1ab0", "\u1ab1", "\u1ab2", "\u1ab3", "\u1ab4", "\u1ab5", "\u1ab6", "\u1ab7", "\u1ab8", "\u1ab9", "\u1aba", "\u1abb", "\u1abc", "\u1abd", "\u1abf", "\u1ac0", "\u1ac1", "\u1ac2", "\u1ac3", "\u1ac4", "\u1ac5", "\u1ac6", "\u1ac7", "\u1ac8", "\u1ac9", "\u1aca", "\u1acb", "\u1acc", "\u1acd", "\u1ace", "\u1b00", "\u1b01", "\u1b02", "\u1b03", "\u1b34", "\u1b36", "\u1b37", "\u1b38", "\u1b39", "\u1b3a", "\u1b3c", "\u1b42", "\u1b6b", "\u1b6c", "\u1b6d", "\u1b6e", "\u1b6f", "\u1b70", "\u1b71", "\u1b72", "\u1b73", "\u1b80", "\u1b81", "\u1ba2", "\u1ba3", "\u1ba4", "\u1ba5", "\u1ba8", "\u1ba9", "\u1bab", "\u1bac", "\u1bad", "\u1be6", "\u1be8", "\u1be9", "\u1bed", "\u1bef", "\u1bf0", "\u1bf1", "\u1c2c", "\u1c2d", "\u1c2e", "\u1c2f", "\u1c30", "\u1c31", "\u1c32", "\u1c33", "\u1c36", "\u1c37", "\u1cd0", "\u1cd1", "\u1cd2", "\u1cd4", "\u1cd5", "\u1cd6", "\u1cd7", "\u1cd8", "\u1cd9", "\u1cda", "\u1cdb", "\u1cdc", "\u1cdd", "\u1cde", "\u1cdf", "\u1ce0", "\u1ce2", "\u1ce3", "\u1ce4", "\u1ce5", "\u1ce6", "\u1ce7", "\u1ce8", "\u1ced", "\u1cf4", "\u1cf8", "\u1cf9", "\u1dc0", "\u1dc1", "\u1dc2", "\u1dc3", "\u1dc4", "\u1dc5", "\u1dc6", "\u1dc7", "\u1dc8", "\u1dc9", "\u1dca", "\u1dcb", "\u1dcc", "\u1dcd", "\u1dce", "\u1dcf", "\u1dd0", "\u1dd1", "\u1dd2", "\u1dd3", "\u1dd4", "\u1dd5", "\u1dd6", "\u1dd7", "\u1dd8", "\u1dd9", "\u1dda", "\u1ddb", "\u1ddc", "\u1ddd", "\u1dde", "\u1ddf", "\u1de0", "\u1de1", "\u1de2", "\u1de3", "\u1de4", "\u1de5", "\u1de6", "\u1de7", "\u1de8", "\u1de9", "\u1dea", "\u1deb", "\u1dec", "\u1ded", "\u1dee", "\u1def", "\u1df0", "\u1df1", "\u1df2", "\u1df3", "\u1df4", "\u1df5", "\u1df6", "\u1df7", "\u1df8", "\u1df9", "\u1dfa", "\u1dfb", "\u1dfc", "\u1dfd", "\u1dfe", "\u1dff", "\u20d0", "\u20d1", "\u20d2", "\u20d3", "\u20d4", "\u20d5", "\u20d6", "\u20d7", "\u20d8", "\u20d9", "\u20da", "\u20db", "\u20dc", "\u20e1", "\u20e5", "\u20e6", "\u20e7", "\u20e8", "\u20e9", "\u20ea", "\u20eb", "\u20ec", "\u20ed", "\u20ee", "\u20ef", "\u20f0", "\u2cef", "\u2cf0", "\u2cf1", "\u2d7f", "\u2de0", "\u2de1", "\u2de2", "\u2de3", "\u2de4", "\u2de5", "\u2de6", "\u2de7", "\u2de8", "\u2de9", "\u2dea", "\u2deb", "\u2dec", "\u2ded", "\u2dee", "\u2def", "\u2df0", "\u2df1", "\u2df2", "\u2df3", "\u2df4", "\u2df5", "\u2df6", "\u2df7", "\u2df8", "\u2df9", "\u2dfa", "\u2dfb", "\u2dfc", "\u2dfd", "\u2dfe", "\u2dff", "\u302a", "\u302b", "\u302c", "\u302d", "\u3099", "\u309a", "\ua66f", "\ua674", "\ua675", "\ua676", "\ua677", "\ua678", "\ua679", "\ua67a", "\ua67b", "\ua67c", "\ua67d", "\ua69e", "\ua69f", "\ua6f0", "\ua6f1", "\ua802", "\ua806", "\ua80b", "\ua825", "\ua826", "\ua82c", "\ua8c4", "\ua8c5", "\ua8e0", "\ua8e1", "\ua8e2", "\ua8e3", "\ua8e4", "\ua8e5", "\ua8e6", "\ua8e7", "\ua8e8", "\ua8e9", "\ua8ea", "\ua8eb", "\ua8ec", "\ua8ed", "\ua8ee", "\ua8ef", "\ua8f0", "\ua8f1", "\ua8ff", "\ua926", "\ua927", "\ua928", "\ua929", "\ua92a", "\ua92b", "\ua92c", "\ua92d", "\ua947", "\ua948", "\ua949", "\ua94a", "\ua94b", "\ua94c", "\ua94d", "\ua94e", "\ua94f", "\ua950", "\ua951", "\ua980", "\ua981", "\ua982", "\ua9b3", "\ua9b6", "\ua9b7", "\ua9b8", "\ua9b9", "\ua9bc", "\ua9bd", "\ua9e5", "\uaa29", "\uaa2a", "\uaa2b", "\uaa2c", "\uaa2d", "\uaa2e", "\uaa31", "\uaa32", "\uaa35", "\uaa36", "\uaa43", "\uaa4c", "\uaa7c", "\uaab0", "\uaab2", "\uaab3", "\uaab4", "\uaab7", "\uaab8", "\uaabe", "\uaabf", "\uaac1", "\uaaec", "\uaaed", "\uaaf6", "\uabe5", "\uabe8", "\uabed", "\ufb1e", "\ufe00", "\ufe01", "\ufe02", "\ufe03", "\ufe04", "\ufe05", "\ufe06", "\ufe07", "\ufe08", "\ufe09", "\ufe0a", "\ufe0b", "\ufe0c", "\ufe0d", "\ufe0e", "\ufe0f", "\ufe20", "\ufe21", "\ufe22", "\ufe23", "\ufe24", "\ufe25", "\ufe26", "\ufe27", "\ufe28", "\ufe29", "\ufe2a", "\ufe2b", "\ufe2c", "\ufe2d", "\ufe2e", "\ufe2f"];
// eslint-disable-next-line prettier/prettier
const invisibleFormatMark = ["\u0600", "\u0601", "\u0602", "\u0603", "\u0604", "\u0605", "\u061c", "\u06dd", "\u070f", "\u0890", "\u0891", "\u08e2", "\u180e", "\u200b", "\u200c", "\u200d", "\u200e", "\u200f", "\u202a", "\u202b", "\u202c", "\u202d", "\u202e", "\u2060", "\u2061", "\u2062", "\u2063", "\u2064", "\u2066", "\u2067", "\u2068", "\u2069", "\u206a", "\u206b", "\u206c", "\u206d", "\u206e", "\u206f", "\ufeff", "\ufff9", "\ufffa", "\ufffb"];

const CategoryCache = new Map();

function getCharUnicodeCategory(char) {
  const cachedCategory = CategoryCache.get(char);
  if (cachedCategory) {
    return cachedCategory;
  }
  const category = {
    isWhitespace: whitespace.includes(char),
    isZeroWidthDiacritic: zeroWidthDiacritic.includes(char),
    isInvisibleFormatMark: invisibleFormatMark.includes(char),
  };
  CategoryCache.set(char, category);
  return category;
}

function clearUnicodeCaches() {
  CategoryCache.clear();
}

export {
  clearUnicodeCaches,
  getCharUnicodeCategory,
  getUnicodeForGlyph,
  getUnicodeRangeFor,
  mapSpecialUnicodeValues,
};
