import { baseUrl } from '/cypress/constants/base.ts';
import { access_token } from "/cypress/constants/base.ts";
import { serialize } from './body.serializer';
import testBody from '/cypress/fixtures/english-procedure/test-body.json';
import bidBody from '/cypress/fixtures/english-procedure/bid-body.json';
import { Body } from '/cypress/shared/interfaces/body.ts';

let proc_id;
let proc_acc_token;
let bidder_1_id;
let bidder_1_token;
let bidder_2_id;
let bidder_2_token;
let rectification_timeout;

res: Body;

describe('API', () => {
    it('#1 Create procedure', () => {
        cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures`, headers: {'Authorization': `${access_token.dev}`}, body: serialize()});
    })
    it ('Create proc and finish it', () => {
        cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures`, headers: {'Authorization': `${access_token.dev}`}, body: testBody}).then((res) => {
            expect(res).to.have.property('status', 201);
            expect(res.body?.id).to.not.be.null;
            expect(res.body?.acc_token).to.not.be.null;
            proc_id = res.body?.id;
            proc_acc_token = res.body?.acc_token;
            cy.request({method: 'GET', url: `${baseUrl.dev}/api/procedures/${proc_id}?acc_token=${proc_acc_token}`}).then((res) => {
                expect(res.body).to.not.be.null;
                rectification_timeout = res.body?.spec.active_tendering.period.duration;
                cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures/${proc_id}/bids`, headers: {'Authorization': `${access_token.dev}`}, body: bidBody}).then((res) => {
                    expect(res).to.have.property('status', 201);
                    expect(res.body?.id).to.not.be.null;
                    expect(res.body?.acc_token).to.not.be.null;
                    bidder_1_id = res.body?.id;
                    bidder_1_token = res.body?.acc_token;
                    cy.wait(rectification_timeout[0] * 60 * 1000);
                    cy.request({method: 'GET', url: `${baseUrl.dev}/api/procedures/${proc_id}?acc_token=${bidder_1_token}`, headers: {'Authorization': `${access_token.dev}`}}).then((res) => {
                        expect(res).to.have.property('status', 200);
                        expect(res.body).to.not.be.null;
                        expect(res.body).to.have.property('participationUrl');
                        expect(res.body?.participationUrl).to.not.be.null;

                    });
                    });
                cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures/${proc_id}/bids`, headers: {'Authorization': `${access_token.dev}`}, body: bidBody}).then((res) => {
                    expect(res).to.have.property('status', 201);
                    expect(res.body?.id).to.not.be.null;
                    expect(res.body?.acc_token).to.not.be.null;
                    bidder_2_id = res.body?.id;
                    bidder_2_token = res.body?.acc_token;
                    cy.wait(rectification_timeout[0] * 60);

                });
            })

        });

    })
})

