import type Discord from 'discord.js';
import Emittery from 'emittery';

const emittery = new Emittery<{
    botReady: Discord.Client<true>;
}>();

export const Events = emittery;
export default emittery;
