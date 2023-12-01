import InitiativeOrder from "./classes/InitiativeOrder";
import InitiativeTableHandler from "./classes/InitiativeTableHandler";
import MonsterDropdown from "./classes/MonsterDropdown";
import InitiativeCreature, { Attitude } from "./classes/InitiativeCreature";


document.addEventListener("DOMContentLoaded", ()=>{
    MonsterDropdown.fetchMonsters();
    InitiativeTableHandler.createTable();

    document.querySelector(".clear-btn")?.addEventListener("click", ()=>InitiativeOrder.clear());
    document.querySelector(".roll-all-btn")?.addEventListener("click", ()=>InitiativeOrder.rollInitiativeForAll());
    document.querySelector(".roll-all-hp-btn")?.addEventListener("click", ()=>InitiativeOrder.rollHPForAll());
    document.querySelector(".roll-nonfriendly-btn")?.addEventListener("click", ()=>{
        InitiativeOrder.rollInitiativeForAttitude([Attitude.Hostile, Attitude.Neutral]);
    });
    document.querySelector(".sort-btn")?.addEventListener("click", ()=>InitiativeOrder.sortCreatures());

    document.querySelector(".next-btn")?.addEventListener("click", ()=>{
        InitiativeOrder.updateCurrentTurn();
        let counter = document.querySelector(".initiative-round-counter");
        if(counter) counter.textContent = "Round: "+InitiativeOrder.round;
    });
    document.querySelector(".reset-rounds-btn")?.addEventListener("click", ()=>{
        InitiativeOrder.round = 0;
        let counter = document.querySelector(".initiative-round-counter");
        if(counter) counter.textContent = "Round: "+InitiativeOrder.round;
    });

    document.querySelector(".plus-btn.friendly")?.addEventListener("click", ()=>InitiativeOrder.addCreature(new InitiativeCreature(Attitude.Friendly)));
    document.querySelector(".plus-btn.neutral")?.addEventListener("click", ()=>InitiativeOrder.addCreature(new InitiativeCreature(Attitude.Neutral)));
    document.querySelector(".plus-btn.hostile")?.addEventListener("click", ()=>InitiativeOrder.addCreature(new InitiativeCreature(Attitude.Hostile)));
});
