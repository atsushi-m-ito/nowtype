"use strict";


function FindNextEffectiveNode(focus_node, focus_offset, upper_limit_node) {
    let target_node;

    if (focus_node.nodeType === Node.TEXT_NODE) {
        if (focus_offset < focus_node.length) {
            return focus_node;
        }
        target_node = focus_node;

    } else {
        if (focus_offset < focus_node.childNodes.length) {
            return focus_node.childNodes[focus_offset];
        } else {
            target_node = focus_node;
        }
    }



    //target_node = target_node.parentNode;
    while (target_node.nextSibling === null) {
        target_node = target_node.parentNode;
        if (target_node === upper_limit_node) {
            return null; //no TEXT_NODE found//
        }
    }
    target_node = target_node.nextSibling;



    return target_node;//no TEXT_NODE found//

}


function FindNextTextNode(focus_node, focus_offset, upper_limit_node) {
    /*
    var target_node;
    var is_end_of_children = false;
    if (focus_node.nodeType === Node.TEXT_NODE) {
        if (focus_offset < focus_node.length) {
            return focus_node;
        }
        is_end_of_children = true;
        target_node = focus_node;

    } else {
        if (focus_offset < focus_node.childNodes.length) {
            target_node = focus_node.childNodes[focus_offset];
        } else {
            is_end_of_children = true;
            target_node = focus_node;
        }
    }

    if (is_end_of_children) {
        if (target_node.nextSibling) {
            target_node = target_node.nextSibling;
        } else {
            //target_node = target_node.parentNode;
            while (target_node.nextSibling === null) {
                target_node = target_node.parentNode;
                if (target_node === upper_limit_node) {
                    return null; //no TEXT_NODE found//
                }
            }
            target_node = target_node.nextSibling;
        }
    }
    */
    let target_node = FindNextEffectiveNode(focus_node, focus_offset, upper_limit_node);

    while (target_node) {

        if (target_node.nodeType === Node.TEXT_NODE) {
            return target_node;
        } else if (target_node.firstChild) {
            target_node = target_node.firstChild;
        } else if (target_node.nextSibling) {
            target_node = target_node.nextSibling;
        } else {
            //target_node = target_node.parentNode;
            while (target_node.nextSibling === null) {
                target_node = target_node.parentNode;
                if (target_node === upper_limit_node) {
                    return null; //no TEXT_NODE found//
                }
            }
            target_node = target_node.nextSibling;
        }
    }

    alert("FindNextTextNode is invalid.");
    return null;//no TEXT_NODE found//

}


function FindPreviousEffectiveNode(focus_node, focus_offset, upper_limit_node) {
    let target_node;
    if (focus_node.nodeType === Node.TEXT_NODE) {
        if (0 < focus_offset) {
            return focus_node;
        }
        target_node = focus_node;

    } else {
        if (0 < focus_offset) {
            return focus_node.childNodes[focus_offset - 1];
        } else {
            target_node = focus_node;
        }
    }


    while (target_node.previousSibling === null) {
        target_node = target_node.parentNode;
        if (target_node === upper_limit_node) {
            return null; //no TEXT_NODE found//
        }
    }
    target_node = target_node.previousSibling;


    return target_node;

}


function FindPreviousTextNode(focus_node, focus_offset, upper_limit_node) {
    /*
    var target_node;
    var is_begin_of_children = false;
    if (focus_node.nodeType === Node.TEXT_NODE) {
        if (0 < focus_offset) {
            return focus_node;
        }
        is_begin_of_children = true;
        target_node = focus_node;

    } else {
        if (0 < focus_offset) {
            target_node = focus_node.childNodes[focus_offset - 1];
        } else {
            is_begin_of_children = true;
            target_node = focus_node;
        }
    }

    if (is_begin_of_children) {
        if (target_node.previousSibling) {
            target_node = target_node.previousSibling;
        } else {
            //target_node = target_node.parentNode;
            while (target_node.previousSibling === null) {
                target_node = target_node.parentNode;
                if (target_node === upper_limit_node) {
                    return null; //no TEXT_NODE found//
                }
            }
            target_node = target_node.previousSibling;
        }
    }
    */
    let target_node = FindPreviousEffectiveNode(focus_node, focus_offset, upper_limit_node);

    while (target_node) {

        if (target_node.nodeType === Node.TEXT_NODE) {
            return target_node;
        } else if (target_node.lastChild) {
            target_node = target_node.lastChild;
        } else if (target_node.previousSibling) {
            target_node = target_node.previousSibling;
        } else {
            //target_node = target_node.parentNode;
            while (target_node.previousSibling === null) {
                target_node = target_node.parentNode;
                if (target_node === upper_limit_node) {
                    return null; //no TEXT_NODE found//
                }
            }
            target_node = target_node.previousSibling;
        }
    }

    alert("FindPrvoiusTextNode is invalid.");
    return null;//no TEXT_NODE found//

}


function GetFirstTextNode(target) {
    while (target) {
        if (target.nodeType === Node.TEXT_NODE) {
            return target;
        }
        target = target.firstChild;
    }
    return null;
}




function FindLastestNode(target) {
    while (target.hasChildNodes()) {
        target = target.lastChild;
    }
    
    return target;
}
