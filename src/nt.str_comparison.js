"use strict";

function StrEnclosureComp(str1, str2){
    const length1 = str1.length;
    const length2 = str2.length;
    const i_end = (length1 < length2) ? length1 : length2;
    
    console.log("StrEnclosureComp1:", str1, "(",length1);
    console.log("StrEnclosureComp2:", str2, "(",length2);
    
    let i;
    for( i = 0; i < i_end; ++i){
        if(str1.charAt(i) != str2.charAt(i)){
            break;
        }
    }
    //here, i is begin point of different cahractors//
    const k_end = i_end - i;

    
    let k;
    for(k = 0; k < k_end; ++k){
        if(str1.charAt(length1 - k - 1) != str2.charAt(length2 - k - 1)){
            break;
        }
    }
    //here, k is end point(which is the next index of different charactors)

    return {begin: i, width1: (length1-k)-i, width2: (length2-k)-i}

}