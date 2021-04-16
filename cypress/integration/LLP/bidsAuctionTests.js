import {access_token, baseUrl} from '/cypress/constants/base.ts';
import testBody from '/cypress/fixtures/documents/LL/LLP/body.json';
import bidBody from '/cypress/fixtures/Bids/bid.json';
import rllBody from '/cypress/fixtures/RLL/objBody.json';

const moment = require('moment');

describe('API', () => {
    cy.all = function () {
        const chainStart = Symbol();
        cy.all = function (...commands) {
            const _ = Cypress._;
            const chain = cy.wrap(null, {log: false});
            const stopCommand = _.find(cy.queue.commands, {
                attributes: {chainerId: chain.chainerId}
            });
            const startCommand = _.find(cy.queue.commands, {
                attributes: {chainerId: commands[0]?.chainerId}
            });
            const p = chain.then(() => {
                return _(commands)
                    .map(cmd => {
                        return cmd[chainStart]
                            ? cmd[chainStart].attributes
                            : _.find(cy.queue.commands, {
                                attributes: {chainerId: cmd.chainerId}
                            }).attributes;
                    })
                    .concat(stopCommand.attributes)
                    .slice(1)
                    .flatMap(cmd => {
                        return cmd.prev.get('subject');
                    })
                    .value();
            });
            p[chainStart] = startCommand;
            return p;
        }
    }
    /*
    1-й варіант:

        Період подання пропозицій:

        1 заява на участь (потенційного орендаря або чинного орендаря)


    Аукціон - відсутній
    Результат:

        Кваліфікація потенційного орендаря або чинного орендаря
     */
    it('Правильність розрахунку поля operatorFee для процедури Subsoil && Коректність установки поля valueAddedTaxIncluded для поля operatorFee у процедурі Subsoil && Правильність розрахунку полів administratorFee, feeSharingWinnerOperator, feeSharingOrganizerOperator для процедури Subsoil', () => {
        let body = testBody;
    let auctionPeriod = {
        "startDate": moment(new Date()).add(5, 'minutes')
    };
    let value = {
        "currency": "UAH",
        "amount": 0,
        "valueAddedTaxIncluded": false
    }
    value.amount = Math.random();
    value.valueAddedTaxIncluded = Math.random() < 0.5;
    body.value = value;
    body.auctionPeriod = auctionPeriod;
        cy.request({
            method: 'POST',
            url: `${baseUrl.dev}/api/registry/objects`,
            headers: {'Authorization': `${access_token.rlldev}`},
            body: {...rllBody}
        }).then((res) => {
            expect(res).to.have.property('status', 201);
            expect(res.body?.id).to.not.be.null;
            expect(res.body?.acc_token).to.not.be.null;
            body.registryId = res.body?.id;
    cy.request({
        method: 'POST',
        url: `${baseUrl.dev}/api/procedures`,
        headers: {'Authorization': `${access_token.dev}`},
        body: {...body}
    }).then((res) => {
        expect(res).to.have.property('status', 201);
        expect(res.body?.id).to.not.be.null;
        expect(res.body?.acc_token).to.not.be.null;
        let proc_id = res.body?.id;
        let proc_acc_token = res.body?.acc_token;
        cy.request({
            method: 'GET',
            url: `${baseUrl.dev}/api/procedures/${proc_id}?acc_token=${proc_acc_token}`
        }).then((res) => {
            expect(res.body).to.not.be.null;
            const rectification_timeout = res.body?.spec.active_rectification.period.duration;
            const tendering_timeout = res.body?.spec.active_tendering.period.duration;
            let bidder_1_id;
            let bidder_1_token;
            let bidder_2_id;
            let bidder_2_token;
            let bidder_1_url;
            let bidder_2_url;
            cy.wait((parseInt(rectification_timeout[0]) * 60 * 1000 + 5000));
            bidBody.value.amount = value.amount + testBody.minimalStep.amount;
            cy.request({
                method: 'POST',
                url: `${baseUrl.dev}/api/procedures/${proc_id}/bids`,
                headers: {'Authorization': `${access_token.dev}`},
                body: bidBody
            }).then((res) => {
                expect(res).to.have.property('status', 201);
                expect(res.body?.id).to.not.be.null;
                expect(res.body?.acc_token).to.not.be.null;
                bidder_1_id = res.body?.id;
                bidder_1_token = res.body?.acc_token;
                const activateBody = {status: 'active'};
                //uploading doc to docService
                /* cy.request({
                     method: 'PUT',
                     url: `${baseUrl.dev}/api/documents/public?documentType=x_nonSanctionedStatement`,
                     headers: {'Authorization': `${access_token.dev}`, 'Content-Type': 'multipart/form-data; boundary='},
                     body: x_nonSanctionedStatement
                 }).then((res) => {
                     console.log(res);
                 });*/
                cy.request({
                    method: 'PATCH',
                    'url': `${baseUrl.dev}/api/procedures/${proc_id}/bids/${bidder_1_id}/status?acc_token=${bidder_1_token}`,
                    headers: {'Authorization': `${access_token.dev}`},
                    body: activateBody
                }).then((res) => {
                    expect(res).to.have.property('status', 200);
                    expect(res.body?.message).to.be.eq('ok');
                });
            });
            cy.wait((parseInt(rectification_timeout[0]) + parseInt(tendering_timeout[0])) * 60 * 1000 + 80000);

        });
    });


        });
    });
});