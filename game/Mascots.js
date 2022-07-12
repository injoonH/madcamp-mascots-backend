import Deck from './Deck.js';
import Player from './Player.js';

class Mascots {
    constructor(nTypes=6, nNums=11, nHand=5, nTable=6) {
        this.nTypes = nTypes;
        this.nNums = nNums;
        this.nHand = nHand;
        this.deck = new Deck(this.nTypes, this.nNums);
        this.table = this.deck.drawCard(nTable);
        this.players = {};
    }

    joinPlayer(uid) {
        const hand = this.deck.drawCard(this.nHand);
        if (hand === null)
            return false;
        this.players[uid] = new Player(uid, hand, Array(this.nTypes).fill().map(() => []));
        return true;
    }

    step(uid, cardIdx, doDraw=true) {
        const player = this.players[uid];
        if (player === undefined)
            return false;
        const card = player.putCardFromHand(cardIdx);
        if (card === null)
            return false;
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
        return true;
    }
}

export default Mascots;


const mm = new Mascots();
const nPlayers = 3;
for (let i = 0; i < nPlayers; ++i)
    mm.joinPlayer(i);
let rounds = Math.floor(mm.deck.getCardsNum() / nPlayers) + 1;

while (rounds--) {
    for (let i = 0; i < nPlayers; ++i) {
        console.log('======================================================');
        const cardIdx = Math.floor(Math.random() * 5);
        console.log(`Player[${i}] put:`, mm.players[i].hand[cardIdx]);
        while (!mm.step(i, cardIdx, rounds > 0));
        console.log(`Player[${i}] hand:`, mm.players[i].hand);
        console.log(`Player[${i}] field:`, mm.players[i].field);
        console.log('Remaining cards num:', mm.deck.getCardsNum());
        console.log('Table:', mm.table);
    }
}
