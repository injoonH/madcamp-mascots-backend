import Card from './Card.js';

class Deck {
    constructor(nTypes=6, nNums=11) {
        this.nTypes = nTypes;
        this.nNums = nNums;
        this.deck = [...Array(this.nTypes * this.nNums).keys()].map(e =>
            new Card(Math.floor(e / this.nNums), e % this.nNums));
        this.shuffle();
    }

    getCardsNum() {
        return this.deck.length;
    }
    
    drawCard(num=1) {
        if (this.getCardsNum() < num)
            return null;
        return this.deck.splice(0, num);
    }

    shuffle() {
        for (let idx = this.getCardsNum(); idx > 0;) {
            const randIdx = Math.floor(Math.random() * idx--);
            [this.deck[idx], this.deck[randIdx]] = [this.deck[randIdx], this.deck[idx]];
        }
    }
}

export default Deck;
