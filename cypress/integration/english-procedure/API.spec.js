import { baseUrl } from '/cypress/constants/base.ts';
import { access_token } from "/cypress/constants/base.ts";
import { serialize } from './body.serializer';

describe('API', () => {
    it('#1 Create procedure', () => {
        cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures`, headers: {'Authorization': `${access_token.dev}`}, body: serialize()});
    })
})