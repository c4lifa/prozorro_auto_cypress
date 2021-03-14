import body from '/cypress/fixtures/english-procedure/body.json';

const settings = {

}

export function serialize() {
    let res;
    let outputBody = [];
    
    //calc max length
    let i = 0;
    let maxLength = 0;
    for (let key in body) {
        i++;
        if (key && body.hasOwnProperty(key)) {
            if (Object.values(body)[i] instanceof Array) {
                console.log(Object.values(body)[i], typeof Object.values(body)[i]);
                let currentLength = Object.values(body)[i].length - 1;
                if (maxLength < currentLength) {
                    maxLength = currentLength;
                }
                console.log(maxLength);
            }
        }
    }

    if (maxLength!==0) {
        for (let i = 0; i <= maxLength; i++) {
            let output = {
                sellingMethod: '',
                sellingEntity: '',
                sdsd: ''
            };
            let length = Object.keys(output).length;
            for (let key in output) {
                if (body[`${key}`] instanceof Array) {
                    output[`${key}`] = body[`${key}`][i];
                    outputBody.push(output);
                    console.log(body[`${key}`])
                } else {
                    console.log(body[`${key}`])
                    output[`${key}`] = body[`${key}`];
                    if (i % length === 0) {
                        outputBody.push(output);
                    }
                }
                console.log(output)
            }
        }
    } else {
        return {};
    }
    console.log(outputBody);
    //assign
    return res;
}

