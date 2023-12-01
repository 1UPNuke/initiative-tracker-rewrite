import { API_URL, DAMAGE_TYPES } from "../globals";
import { DamageTypeModifier, DamageTypeString } from "../types/DamageTypeModifier";
import { Monster } from "../types/apitypes/monster";
import InitiativeCreature from "./InitiativeCreature";
import InitiativeOrder from "./InitiativeOrder";
import InitiativeTableHandler from "./InitiativeTableHandler";
import MonsterList from "./MonsterList";

const MONSTER_DROPDOWN_ID = "monster-dropdown";


export default class MonsterDropdown{
    private static dropdown : HTMLUListElement | null = null;
    private static monsters : MonsterList | null = null;

    public static async fetchMonsters() {
        MonsterDropdown.monsters = await MonsterList.fetch();
    }

    public static searchPickFirst() {
        if(MonsterDropdown.dropdown && MonsterDropdown.dropdown.children[0] instanceof HTMLElement) {
            MonsterDropdown.dropdown.children[0].click();
        }
    }

    public static searchDropdownEdit(event : Event) {
        // Typescript type checking
        if(MonsterDropdown.monsters == null) return;
        const input = event.target;
        if(input == null || !(input instanceof HTMLElement)) return;
        const cell = input.parentElement;
        if(cell == null) return;

        // Get the value of the input that is requesting the search
        let search : string = input.textContent || "";

        // Filter the MonsterDropdown.monsters to only the ones that contain the search
        let result = MonsterDropdown.monsters.searchMonsters(search);

        // Remove the old MonsterDropdown.dropdown
        MonsterDropdown.searchDropdownRemove();

        // Create a new MonsterDropdown.dropdown
        MonsterDropdown.dropdown = document.createElement("ul");
        MonsterDropdown.dropdown.id = MONSTER_DROPDOWN_ID;

        // Populate it with new elements
        for(let monster of result) {
            const li = document.createElement("li");

            li.textContent = monster.name;

            // Store the url in the dataset for use when we click it
            li.dataset.monsterUrl = monster.url;
            li.addEventListener("mousedown", MonsterDropdown.clickSearchItem);

            MonsterDropdown.dropdown.appendChild(li);
        }

        // Append the MonsterDropdown.dropdown to the cell the input is in for positioning
        cell.appendChild(MonsterDropdown.dropdown);
    }

    public static searchDropdownRemove() {
        if(MonsterDropdown.dropdown) MonsterDropdown.dropdown.parentElement?.removeChild(MonsterDropdown.dropdown);
        let oldDropdown = document.getElementById(MONSTER_DROPDOWN_ID);
        if(oldDropdown) oldDropdown.parentElement?.removeChild(oldDropdown);
    }

    public static async clickSearchItem(event : Event) {
        // Typescript type checking
        if(event.target == null || !(event.target instanceof HTMLLIElement)) return;

        // The current cell where this MonsterDropdown.dropdown is attached
        let cell = event.target.parentElement?.parentElement;
        if(cell == null) return;

        if(!MonsterDropdown.dropdown) return;

        // Remove the MonsterDropdown.dropdown
        MonsterDropdown.searchDropdownRemove();

        // Fetch the full details of the monster from the API based on the URL in the dataset
        let request = await fetch(API_URL + event.target.dataset.monsterUrl);
        let monster : Monster = await request.json();

        // Figure out which creature to edit
        const row = cell.parentElement;
        if(!row) return;
        const creatureId = +(row.dataset.creatureId ?? NaN);
        if(isNaN(creatureId)) return;

        // Edit the creature based on the data from the API
        let creature : InitiativeCreature | undefined = InitiativeOrder.getCreature(creatureId);
        if(!creature) return;

        creature.armor_class = monster.armor_class[0].value;
        creature.initBonus = Math.floor((monster.dexterity - 10) / 2);
        creature.hit_points = monster.hit_points;
        creature.hit_points_roll = monster.hit_points_roll;
        creature.name = monster.name;
        creature.dmgTypeMod = [];
        creature.notes = monster.size + " " + monster.type + ", " + monster.alignment;
        creature.statBlockUrl = `https://www.aidedd.org/dnd/monstres.php?vo=${monster.index}`;

        let res = monster.damage_resistances.map(resistance => ({type: "resistance", data: resistance}));
        let vul = monster.damage_vulnerabilities.map(vulnerability => ({type: "vulnerability", data: vulnerability}));
        let imm = monster.damage_immunities.map(immunity => ({type: "immunity", data: immunity}));
        
        
        let modifiers : {type : string, data : string}[] = [...vul, ...res, ...imm];


        // Loop through the modifiers
        for(let mod of modifiers) {
            // If it is a physical damage resistance, break it down into its parts
            if(mod.data.startsWith("bludgeoning, piercing, and slashing")) {
                let suffix = mod.data.substr(mod.data.indexOf("slashing")+8);

                modifiers.push({type: mod.type, data:"bludgeoning"+suffix});
                modifiers.push({type: mod.type, data:"piercing"+suffix});
                modifiers.push({type: mod.type, data:"slashing"+suffix});

                continue;
            }

            creature.dmgTypeMod.push(MonsterDropdown.handleModifier(mod));
        }

        InitiativeOrder.updateCreature(creatureId, creature);

        InitiativeTableHandler.updateTable();
    }

    private static handleModifier(mod : {type : string, data : string})  : DamageTypeModifier {
        const tooltip = mod.type + " to " + mod.data;

        // Determine if the modifier only applies magical, nonmagical, or both
        const magical = mod.data.indexOf(" magical") >= 0;
        const nonmagical = mod.data.indexOf("nonmagical") >= 0;
        const bothM = magical == nonmagical;

        // Determine if the modifier only applies silvered, nonsilver, or both
        const silvered = mod.data.indexOf(" silvered") >= 0;
        const nonsilvered = mod.data.indexOf("nonsilver") >= 0;
        const bothS = silvered == nonsilvered;

        // Determine if the modifier only applies amantine, nonadamantine, or both
        const adamantine = mod.data.indexOf("are adamantine") >= 0;
        const nonadamantine = mod.data.indexOf("aren't adamantine") >= 0;
        const bothA = adamantine == nonadamantine;

        if(!bothM || !bothS) {
            mod.data = mod.data.replace("from magical/silvered weapons", "");
            mod.data = mod.data.replace("from nonmagical/nonsilver weapons", "");
            mod.data = mod.data.replace("from magical weapons", "");
            mod.data = mod.data.replace("from nonmagical weapons", "");
            mod.data = mod.data.replace("from silvered weapons", "");
            mod.data = mod.data.replace("from nonsilver weapons", "");
            mod.data = mod.data.replace("that aren't adamantine", "");
            mod.data = mod.data.replace("that are adamantine", "");
            mod.data = mod.data.replace("  ", " ");
            mod.data = mod.data.trim();
        }

        if(!DAMAGE_TYPES.includes(mod.data as DamageTypeString)) {
            console.log("Unrecognised damage type: "+mod.data);
            mod.data = "other";
        }

        // Create the modifier
        return {
            type: mod.data as DamageTypeString,
            magical : bothM ? "both-magical" : magical ? "magical" : "nonmagical",
            silvered : bothS ? "both-silver" : silvered ? "silvered" : "nonsilvered",
            adamantine : bothA ? "both-adamantine" : adamantine ? "adamantine" : "nonadamantine",
            modifier : mod.type as "resistance" | "vulnerability" | "immunity",
            desc : tooltip
        }
    }
}