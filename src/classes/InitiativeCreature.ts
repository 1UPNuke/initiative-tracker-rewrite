import DiceRoller from "./DiceRoller";
import { DamageTypeModifier } from "../types/DamageTypeModifier";

export enum Attitude {
    Hostile = -1,
    Neutral = 0,
    Friendly = 1
}

export default class InitiativeCreature {
    public id : number = 0;
    public attitude : Attitude = Attitude.Neutral;
    public initiative : number = Number.MIN_SAFE_INTEGER;
    public initBonus : number = 0;
    public name : string = "";
    public hit_points : number = NaN;
    public hit_dice : string = "";
    public hit_point_bonus : number = 0;
    public armor_class : number = NaN;
    public dmgTypeMod : DamageTypeModifier[] = [];
    public rowElem : HTMLTableRowElement | null = null;
    public isTurn : boolean = false;
    public notes : string = "";
    public statBlockUrl : string = "";

    constructor(creature : Object = {}) {
        for(let key of Object.keys(creature)) {
            // @ts-ignore
            this[key] = creature[key];
        }
    }

    public async rollInitiative(physical : boolean = true) : Promise<string> {
        // We use deterministic dice rolling to guarantee a result even if interrupted
        let result = Math.floor(Math.random() * 20)+1;
        const roll = "1d20@"+result;
        if(physical) await DiceRoller.roll(roll);
        this.initiative = result;
        return roll;
    }

    public async rollHP(physical : boolean = true) : Promise<string> {
        if(!this.hit_dice) return "";
        let [count, dice] = this.hit_dice.split("d").map(x=>+x);
        let bonus = this.hit_point_bonus;
        let total = bonus || 0;
        let results = [];
        for(let i = 0; i < count; i++) {
            let result = Math.floor(Math.random() * dice)+1;
            total += result;
            results.push(result);
        }
        const roll = `${count}d${dice}@${results.join()}+${bonus || 0}`;
        if(physical) await DiceRoller.roll(roll);
        if(total <= 0) total = 1;
        this.hit_points = total;
        return roll;
    }

    public clone() : InitiativeCreature {
        let creature = new InitiativeCreature();
        for(let [key, value] of Object.entries(this)) {
            if(typeof value === "function") continue;
            (creature as {[key: string]: any})[key] = structuredClone(value);
        }
        return creature;
    }
}
