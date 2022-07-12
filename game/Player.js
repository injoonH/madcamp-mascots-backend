class Player {
    constructor(uid, hand, field) {
        this.uid = uid;
        this.hand = hand;
        this.field = field;
    }

    drawCardFromDeck(deck) {
        const card = deck.drawCard();
        if (card === null)
            return false;
        this.hand.push(card[0]);
        return true;
    }

    putCardFromHand(idx) {
        if (0 <= idx && idx < this.hand.length)
            return this.hand.splice(idx, 1)[0];
        return null;
    }

    getCardsFromTable(cards) {
        for (let card of cards)
            this.field[card.type].push(card.num);
    }
}

export default Player;
