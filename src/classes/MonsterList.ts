import { API_URL } from "../globals";
import { APIReference } from "../types/apitypes/common";

export default class MonsterList {
    private monsters : APIReference[] = [];

    private constructor(monsters : APIReference[]) {
        this.monsters = monsters;
    }

    static async fetch() : Promise<MonsterList> {
        const response = await fetch(API_URL + "/api/monsters");
        const json = await response.json();
        return new MonsterList(json.results);
    }

    public getMonsters() : APIReference[] {
        return this.monsters;
    }

    public searchMonsters(search : string) : APIReference[] {
        search = search.toLowerCase();
        // Filter the monsters to only the ones that contain the search
        let result = this.monsters.filter(monster =>{
            return monster.name.toLowerCase().includes(search);
        });

        // Sort the monsters based on which contains the search first
        return result.sort((a,b) => {
            return a.name.toLowerCase().indexOf(search) - b.name.toLowerCase().indexOf(search);
        });
    }
}