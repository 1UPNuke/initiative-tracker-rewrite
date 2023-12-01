import { rollDice } from "../dicebox";
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
    public hit_points_roll : string = "";
    public armor_class : number = NaN;
    public dmgTypeMod : DamageTypeModifier[] = [];
    public rowElem : HTMLTableRowElement | null = null;
    public isTurn : boolean = false;
    public notes : string = "";
    public statBlockUrl : string = "";

    public async rollInitiative(physical : boolean = true) : Promise<string> {
        // We use deterministic dice rolling to guarantee a result even if interrupted
        let result = Math.floor(Math.random() * 20)+1;
        const roll = "1d20@"+result;
        if(physical) await rollDice(roll);
        this.initiative = result;
        return roll;
    }

    public async rollHP(physical : boolean = true) : Promise<string> {
        if(!this.hit_points_roll) return "";
        let [count, dice, bonus] = this.hit_points_roll.split("d").join("+").split("+").map(x=>+x);
        let total = bonus || 0;
        let results = [];
        for(let i = 0; i < count; i++) {
            let result = Math.floor(Math.random() * dice)+1;
            total += result;
            results.push(result);
        }
        const roll = `${count}d${dice}@${results.join()}+${bonus || 0}`;
        if(physical) await rollDice(roll);
        this.hit_points = total;
        return roll;
    }

    constructor(attitude = Attitude.Neutral) {
        this.attitude = attitude;
    }
}