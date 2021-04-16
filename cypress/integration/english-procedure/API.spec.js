import { baseUrl } from '/cypress/constants/base.ts';
import { access_token } from "/cypress/constants/base.ts";
import { serialize } from './body.serializer';
import testBody from '/cypress/fixtures/english-procedure/test-body.json';
import bidBody from '/cypress/fixtures/english-procedure/bid-body.json';
import lleDocs from '/cypress/fixtures/documents/LL/LLE/docTypes.json';
import { Body } from '/cypress/shared/interfaces/body.ts';
const moment = require('moment');

let proc_id;
let proc_acc_token;

res: Body;

describe('API', () => {
    it('#1 Create procedure', () => {
        cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures`, headers: {'Authorization': `${access_token.dev}`}, body: serialize()});
    })
    it('Create proc and finish it', () => {
        //calculation of startDate
        const startDate = moment(new Date()).add(5, 'minutes');
        let body = testBody;
        testBody.auctionPeriod.startDate = startDate;
        cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures`, headers: {'Authorization': `${access_token.dev}`}, body: body}).then((res) => {
            expect(res).to.have.property('status', 201);
            expect(res.body?.id).to.not.be.null;
            expect(res.body?.acc_token).to.not.be.null;
            proc_id = res.body?.id;
            proc_acc_token = res.body?.acc_token;
            cy.request({method: 'GET', url: `${baseUrl.dev}/api/procedures/${proc_id}?acc_token=${proc_acc_token}`}).then((res) => {
                expect(res.body).to.not.be.null;
                const rectification_timeout = res.body?.spec.active_tendering.rectification_period.duration;
                const tendering_timeout = res.body?.spec.active_tendering.period.duration;
                let bidder_1_id;
                let bidder_1_token;
                let bidder_2_id;
                let bidder_2_token;
                let bidder_1_url;
                let bidder_2_url;
                cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures/${proc_id}/bids`, headers: {'Authorization': `${access_token.dev}`}, body: bidBody}).then((res) => {
                    expect(res).to.have.property('status', 201);
                    expect(res.body?.id).to.not.be.null;
                    expect(res.body?.acc_token).to.not.be.null;
                    bidder_1_id = res.body?.id;
                    bidder_1_token = res.body?.acc_token;
                    const activateBody = {status: 'active'};
                    cy.request({method: 'PATCH', 'url': `${baseUrl.dev}/api/procedures/${proc_id}/bids/${bidder_1_id}/status?acc_token=${bidder_1_token}`, headers: {'Authorization': `${access_token.dev}`}, body: activateBody}).then((res) => {
                        expect(res).to.have.property('status', 200);
                        expect(res.body?.message).to.be.eq('ok');
                    });
                });
                cy.request({method: 'POST', url: `${baseUrl.dev}/api/procedures/${proc_id}/bids`, headers: {'Authorization': `${access_token.dev}`}, body: bidBody}).then((res) => {
                    expect(res).to.have.property('status', 201);
                    expect(res.body?.id).to.not.be.null;
                    expect(res.body?.acc_token).to.not.be.null;
                    bidder_2_id = res.body?.id;
                    bidder_2_token = res.body?.acc_token;
                    const activateBody = {status: 'active'};
                    cy.request({method: 'PATCH', 'url': `${baseUrl.dev}/api/procedures/${proc_id}/bids/${bidder_2_id}/status?acc_token=${bidder_2_token}`, headers: {'Authorization': `${access_token.dev}`}, body: activateBody}).then((res) => {
                        expect(res).to.have.property('status', 200);
                        expect(res.body?.message).to.be.eq('ok');
                    });
                });
                cy.wait((parseInt(rectification_timeout[0]) + parseInt(tendering_timeout[0])) * 60 * 1000);
                cy.request({method: 'GET', url: `${baseUrl.dev}/api/procedures/${proc_id}?acc_token=${bidder_2_token}`, headers: {'Authorization': `${access_token.dev}`}}).then((res) => {
                    expect(res).to.have.property('status', 200);
                    expect(res.body).to.not.be.null;
                    expect(res.body?.bids[0]).to.have.property('participationUrl');
                    expect(res.body?.bids[0]?.participationUrl).to.not.be.null;
                    bidder_2_url = res.body?.bids[0]?.participationUrl;
                });
                cy.request({method: 'GET', url: `${baseUrl.dev}/api/procedures/${proc_id}?acc_token=${bidder_1_token}`, headers: {'Authorization': `${access_token.dev}`}}).then((res) => {
                    expect(res).to.have.property('status', 200);
                    expect(res.body).to.not.be.null;
                    expect(res.body?.bids[0]).to.have.property('participationUrl');
                    expect(res.body?.bids[0]?.participationUrl).to.not.be.null;
                    bidder_1_url = res.body?.bids[0]?.participationUrl;
                });
            });

        });

    });
    it('Upload docs to doc service', () => {
        let docsTokens = [];
        let usedDocTypes = [];
        for (let keys in lleDocs) {
            for (let j = 0; j <= keys.length-1; j++) {
                if (!lleDocs[keys][j] in usedDocTypes) {
                    usedDocTypes.push(lleDocs[keys][j]);
                    cy.request({method: 'PUT', url: `${baseUrl.dev}/api/documents/public?documentType=${lleDocs[keys][j]}`, headers: {'Authorization': `${access_token.dev}`}}).then((res) => {
                        docsTokens.push({docType: `${lleDocs[keys][j]}`, value: res});
                        console.log(docsTokens);
                    });
                } else {
                    return;
                }
            }
        }
    });
});

