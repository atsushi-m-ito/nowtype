"use strict";

function ReplaceAll(text_org, before_word, after_word){
    let i = text_org.indexOf(before_word, 0);
    if(i < 0) return text_org;
    const before_len = before_word.length;
    let result = text_org.slice(0, i ) + after_word;
    let offset = i + before_len;
    i = text_org.indexOf(before_word, offset);
    while(i >= 0){
        result += text_org.slice(offset, i) + after_word;
        offset = i + before_len;
        i = text_org.indexOf(before_word, offset);
    }

    result += text_org.slice(offset);
    return result;
}

/*
if the next word is indicated word, it does not replace
*/
function ReplaceAllExcept(text_org, before_word, after_word, ignore_next){
    let i = text_org.indexOf(before_word, 0);
    if(i < 0) return text_org;
    const before_len = before_word.length;
    if(i + before_len >= text_org.length) return text_org;
    while (text_org.startsWith(ignore_next, i + before_len)){
        i = text_org.indexOf(before_word, i+1);
        if(i < 0) return text_org;
        if(i + before_len >= text_org.length) return text_org;
    }
    
    let result = text_org.slice(0, i ) + after_word;
    let offset = i + before_len;
    i = text_org.indexOf(before_word, offset);
    while((i >= 0) && (i + before_len < text_org.length)){
        if(text_org.startsWith(ignore_next, i + before_len)){
            i = text_org.indexOf(before_word, i+1);
            
        }else{
            result += text_org.slice(offset, i) + after_word;
            offset = i + before_len;
            i = text_org.indexOf(before_word, offset);
        }
    }

    result += text_org.slice(offset);
    return result;
}

/*
the word sand by begin_word and end_word is replaced by after_word;

*/
function ReplaceByRangeAll(text_org, begin_word, end_word, after_word){
    let i = text_org.indexOf(begin_word, 0);
    if(i < 0) return text_org;
    const begin_len = begin_word.length;
    let k = text_org.indexOf(end_word, i + begin_len);
    if(k < 0) return text_org;
    const end_len = end_word.length;
    let result = text_org.slice(0, i ) + after_word;
    let offset = k + end_len;
    i = text_org.indexOf(begin_word, offset);
    while(i >= 0){
        k = text_org.indexOf(end_word, i + begin_len);
        if(k < 0) break;

        result += text_org.slice(offset, i) + after_word;
        offset = k + end_len;
        i = text_org.indexOf(begin_word, offset);
    }

    result += text_org.slice(offset);
    return result;
}


function IsAlphabet(str){
    return (str.charCodeAt(0) < 128);
    
    //if(('A' <= ) && (str <= 'z')){return true;}
    //return false;    
}

function ReplaceLinebreakToSpaceForJP(text_org){
    const before_word = '\n';
    const after_word = ' ';
    const before_len = before_word.length;
    
    let offset = 0;
    let i = text_org.indexOf(before_word, offset);
    if(i < 0) return text_org;

    if(i===0){
        offset = 1;
        i = text_org.indexOf(before_word, offset);
        if(i < 0) return text_org.slice(offset);
    }

    let result = "";
    while(i >= 0){
        if(i===text_org.length-1){
            result += text_org.slice(offset, i);
        }else if(IsAlphabet(text_org[i-1]) || IsAlphabet(text_org[i+1])){
            result += text_org.slice(offset, i) + after_word;
        }else{
            result += text_org.slice(offset, i);
        }
        offset = i + 1;
        i = text_org.indexOf(before_word, offset);
    }

    result += text_org.slice(offset);
    return result;
}
