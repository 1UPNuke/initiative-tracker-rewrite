import DiceRoller from "./DiceRoller";
import InitiativeCreature, { Attitude } from "./InitiativeCreature";
import InitiativeTableHandler from "./InitiativeTableHandler";

export default abstract class InitiativeOrder {
    private static initiativeCreatures : InitiativeCreature[] = [];
    private static runningId = 0;
    public static round = 0;

    public static addCreature(creature : InitiativeCreature) : number {
        this.runningId++;
        creature.id = this.runningId;
        InitiativeOrder.initiativeCreatures.push(creature);

        InitiativeTableHandler.updateTable();

        return creature.id;
    }

    public static getCreature(id : number) : InitiativeCreature | undefined {
        return InitiativeOrder.initiativeCreatures.find(x => x.id === id);
    }

    public static updateCreature(id : number, data : InitiativeCreature) {
        console.log(InitiativeOrder.initiativeCreatures);
        let index = InitiativeOrder.initiativeCreatures.findIndex(x => x.id === id);
        data.id = InitiativeOrder.initiativeCreatures[index].id;
        InitiativeOrder.initiativeCreatures[index] = data;

        InitiativeTableHandler.updateTable();
    }

    public static updateCreatureNoRefresh(id : number, data : InitiativeCreature) {
        console.log(InitiativeOrder.initiativeCreatures);
        let index = InitiativeOrder.initiativeCreatures.findIndex(x => x.id === id);
        data.id = InitiativeOrder.initiativeCreatures[index].id;
        InitiativeOrder.initiativeCreatures[index] = data;
    }

    public static removeCreature(id : number) : number {
        InitiativeOrder.initiativeCreatures = InitiativeOrder.initiativeCreatures.filter(x => x.id !== id);

        InitiativeTableHandler.updateTable();

        return InitiativeOrder.initiativeCreatures.length;
    }

    public static getAllCreatures() : InitiativeCreature[] {
        return InitiativeOrder.initiativeCreatures;
    }

    public static sortCreatures() : void {
        InitiativeOrder.initiativeCreatures = InitiativeOrder.initiativeCreatures.sort((a,b)=>{
            // Preference for higher total initiative
            let sort = (b.initiative + b.initBonus) - (a.initiative + a.initBonus);
            // Secondary preference for friendly creatures
            if (sort == 0) {
                sort = b.attitude - a.attitude;
            }

            return sort;
        });

        InitiativeTableHandler.updateTable();
    }

    public static async rollInitiative(id : number) {
        const creature = this.getCreature(id);
        if(!creature) return;
    
        await creature.rollInitiative();

        InitiativeTableHandler.updateTable();
    }

    public static async rollInitiativeForAll() {
        let rolls : number[] = [];
        for(let creature of InitiativeOrder.initiativeCreatures) {
            // We use deterministic dice rolling to guarantee a result even if interrupted
            rolls.push(Math.floor(Math.random()*20)+1);
            creature.initiative = rolls[rolls.length-1];
        }
        await DiceRoller.roll(rolls.length+"d20@"+rolls.join());

        InitiativeTableHandler.updateTable();
    }

    public static async rollInitiativeForAttitude(attitudes : Attitude[]) {
        let rolls : number[] = [];
        for(let creature of InitiativeOrder.initiativeCreatures) {
            if(attitudes.includes(creature.attitude)) {
                // We use deterministic dice rolling to guarantee a result even if interrupted
                rolls.push(Math.floor(Math.random()*20)+1);
                creature.initiative = rolls[rolls.length-1];
            }
        }
        await DiceRoller.roll(rolls.length+"d20@"+rolls.join());

        InitiativeTableHandler.updateTable();
    }

    public static async rollHP(id : number) {
        const creature = this.getCreature(id);
        if(!creature) return;
    
        await creature.rollHP();

        InitiativeTableHandler.updateTable();
    }

    public static async rollHPForAll() {
        await DiceRoller.roll("3d4+3d6+3d8+3d10+3d12+3d20");

        for(let creature of InitiativeOrder.initiativeCreatures) {
            if(creature.hit_dice) {
                creature.rollHP(false);
            }
        }

        InitiativeTableHandler.updateTable();
    }

    public static clear() {
        let shouldClear = confirm("Are you sure you want to clear the table?");
        if (!shouldClear) return;
        InitiativeOrder.initiativeCreatures = [];
        InitiativeTableHandler.updateTable();
    }

    public static updateCurrentTurn(amount : -1 | 1 = 1) {
        if (InitiativeOrder.initiativeCreatures.length == 0) {
            InitiativeOrder.round += amount;
            return;
        }

        // Find the index of the current turn holder
        let currentTurnIndex = InitiativeOrder.initiativeCreatures.findIndex(creature => creature.isTurn);

        let len = InitiativeOrder.initiativeCreatures.length;

        // If nobody is having a turn, select either the first or last creature, depending on the direction
        if(currentTurnIndex == -1) {
            let i = amount < 0 ? len - 1 : 0;
            InitiativeOrder.initiativeCreatures[i].rowElem?.classList.add("current-turn");
            InitiativeOrder.initiativeCreatures[i].isTurn = true;
            InitiativeOrder.round += amount;
            InitiativeTableHandler.updateTable();
            return;
        }

        // Remove the turn from the current holder
        InitiativeOrder.initiativeCreatures[currentTurnIndex].rowElem?.classList.remove("current-turn");
        InitiativeOrder.initiativeCreatures[currentTurnIndex].isTurn = false;

        // Blank turns for clean table view and for counting rounds
        if(currentTurnIndex == len - 1 && amount > 0) {
            InitiativeTableHandler.updateTable();
            return;
        }
        if(currentTurnIndex == 0 && amount < 0) {
            InitiativeTableHandler.updateTable();
            return;
        }

        // Add the amount to the current turn index and bring it back in bounds
        currentTurnIndex += amount;
        currentTurnIndex %= len;

        // Give the turn to the new holder
        InitiativeOrder.initiativeCreatures[currentTurnIndex].rowElem?.classList.add("current-turn");
        InitiativeOrder.initiativeCreatures[currentTurnIndex].isTurn = true;

        InitiativeTableHandler.updateTable();
    }

    public static cloneCreature(id : number) : number | undefined {
        let creature = InitiativeOrder.getCreature(id)?.clone();
        if(!creature) return undefined;
        return InitiativeOrder.addCreature(creature);
    }
}
