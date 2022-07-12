import Deck from './Deck.js';
import Player from './Player.js';

class Mascots {
    constructor(playerIds, nTypes=6, nNums=11, nHand=5, nTable=6) {
        this.deck = new Deck(this.nTypes, this.nNums);
        this.table = this.deck.drawCard(nTable);

        this.nTypes = nTypes;
        this.nNums = nNums;
        this.nHand = nHand;
        this.nTable = nTable;

        this.players = playerIds.map(id => {
            const hand = this.deck.drawCard(this.nHand);
            if (hand === null)
                return null;
            return new Player(id, hand, Array(this.nTypes).fill().map(() => []));
        });

        this.turn = 0;
        this.round = 0;
        this.totRounds = Math.round((this.nNums * this.nTypes - this.nTable) / this.players.length) - this.nHand;
    }

    getCurrTurnPlayerId() {
        return this.players[this.turn].uid;
    }

    getSharedStates() {
        return {
            table: this.table.map(card => ({ type: card.type, num: card.num })),
            fields: Object.fromEntries(this.players.map(player => [player.uid, player.field])),
            deckCardsNum: this.deck.getCardsNum(),
            currPlayerId: this.getCurrTurnPlayerId(),
        };
    }

    getStates() {
        const sharedStates = this.getSharedStates();
        return Object.fromEntries(this.players.map(player => [
            player.uid,
            {
                ...sharedStates,
                hand: player.hand.map(card => ({ type: card.type, num: card.num })),
            }
        ]));
    }

    step(cardIdx, doDraw=true) {
        const player = this.players[this.turn];
        console.log(player);
        const card = player.putCardFromHand(cardIdx);
        if (card === null)
            return { success: false, gameFin: false };
        if (this.table.length > card.num) {
            player.getCardsFromTable(
                this.table
                .slice(0, this.table.length - card.num)
                .filter(el => el.type == card.type || el.num <= card.num));
            this.table = this.table.filter((el, idx) =>
                idx >= this.table.length - card.num || (el.type != card.type && el.num > card.num));
        }
        this.table.push(card);
        if (doDraw)
            player.drawCardFromDeck(this.deck);
        if (++this.turn === this.players.length) {
            this.turn = 0;
            if (++this.round === this.totRounds)
                return { success: true, gameFin: true };
        }
        return { success: true, gameFin: false };
    }
}

export default Mascots;


const mm = new Mascots(['Andy', 'Bob', 'Carl', 'Dani']);
console.log('Total Rounds:', mm.totRounds);
console.log(mm.getStates());

while (true) {
    console.log('======================================================');
    console.log(`ID: ${mm.getCurrTurnPlayerId()}`);
    const cardIdx = Math.floor(Math.random() * 5);
    const { success, gameFin } = mm.step(cardIdx);
    if (success === false) {
        console.log('failed')
    } else {
        console.log(mm.getStates());
    }
    if (gameFin)
        break;
}
