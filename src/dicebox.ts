import DiceBox from "@3d-dice/dice-box-threejs";

let dicebox : any = null;

let diceClearTimeout : number = NaN;

async function initDiceBox() {
    dicebox = new DiceBox("#dicebox", {
        sounds: true
    });
    await dicebox.initialize();
}

export async function rollDice(dice : string | string[]) {
    console.log(dice);
    if(dicebox === null) await initDiceBox();
    let boxElem = (document.querySelector("#dicebox") as HTMLElement);
    return new Promise<void>(async (resolve, reject) => {
        window.setTimeout(resolve, 5000);
        boxElem.style.opacity = "1";
        await dicebox.roll(dice);
        window.clearTimeout(diceClearTimeout);
        diceClearTimeout = window.setTimeout(()=>boxElem.style.opacity = "0", 1000);
        resolve();
    });
}
