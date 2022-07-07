import Card from './Card';

class Deck {
    constructor(nTypes, nNums) {
        this.nTypes = nTypes;
        this.nNums = nNums;
        this.deck = [...Array(this.nTypes * this.nNums).keys()].map(e =>
            new Card(Math.floor(e / this.nNums, e & this.nNums)));
    }

    isDeckEmpty() {
        return this.deck.length === 0;
    }
    
    drawCard() {
        if (this.isDeckEmpty())
            return null;
        return this.deck.pop();
    }
}

export default Deck;
