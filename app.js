
// Firebase
firebase = require('firebase')
var { firebaseConfig } = require('./credentials.json');
firebase.initializeApp(firebaseConfig);
//   firebase.analytics();
const db = firebase.firestore();

const Discord = require('discord.js');

const { token } = require('./credentials.json');

const bot = new Discord.Client();

///////////////////////////////////// FUNÇÕES AUXILIARES /////////////////////////////////////////

// Descrições de Usuário
const descsIds      = ["nome", "apelido", "titulo", "idade", "niver", "gosto", "frase", "profissao", "hobby", "musica", "meme", "idolo", "famoso", "lolchamp"];
const descsNames    = ["Nome", "Apelido", "Titulo", "Idade", "Data_de_Aniversario", "O_que_mais_gosto_de_fazer", "Minha_frase", "Futura_profissao", "Hobby", "Minha_musica", "Meu_meme", "Meu_idolo", "Alguns_me_confundem_com", "Se_eu_fosse_um_champ_do_LoL_eu_seria"];

// template de descrição
function newMemberDescription() {
    return ({
        "nome" : "",
        "apelido" : "",
        "titulo" : "",
        "idade" : "",
        "niver" : "",
        "gosto" : "",
        "frase" : "",
        "profissao" : "",
        "hobby" : "",
        "musica" : "",
        "meme" : "",
        "idolo" : "",
        "famoso" : "",
        "lolchamp" : "",
    });
}

function showDescription(id, msg, username) {
    db.collection("descricoes").doc(id).get().then(doc => {
        descArr = []
        for(i = 0; i < descsIds.length; i++) {
            descArr[i] = descsNames[i] + ": " + doc.data()[descsIds[i]] + "\n"
        }
        
        msg.channel.send(">>> ```yaml\n" + `DESCRIÇÃO DE @${username} \n` + descArr.join("") + "```")
    }).catch(err => {
        msg.reply("provavelmente a descrição de <@!" + id + "> não existe ainda. Você pode criá-la com o comando: \n" +  "```!a.desc   @<NOME_DO_USUÁRIO>```")
    })
    
}

// Cardápio
const menu = ["breja", "cafézinho_do_Marcelo"]
const menuEmoji = [":beer:", ":coffee:"]

function showMenu(msg) {
    menuArr = []
    for(i = 0; i < menu.length; i++) {
        menuArr[i] = "\t- " + menu[i] + "\n"
    }
    
    msg.channel.send(">>> ```yaml\nCARDAPIO:\n"+ `${menuArr.join("")}` + "\n```")
}

function showHelp(msg) {
    a = 20
    let help = ">>> ```yaml" + `\n\
    Don't worry, child. Estou aqui para ajudar!\n\
    \n Comandos_Gerais: \n\
    !a.help            --> Pedir Ajuda \n\
    !a.cardapio        --> Mostrar cardápio \n\
    !a.pedir <petisco> --> Pedir algo do cardápio\n\
    \n Descricao_de_Usuarios:\n\
    - MOSTRAR: \n\
    !a.desc   @<NOME_DO_USUÁRIO>\n\
    - EDITAR: \n\
    !a.edit.<CAMPO>  @<NOME_DO_USUÁRIO>  <DESCRIÇÃO>\n\
    - CAMPOS:
    * ${descsIds.join(", * ")}` + "\n\
    ```"
    
    
    msg.channel.send(help) 
}


/////////////////////////////////////// REAÇÕES ALFRED ///////////////////////////////////////////
// Alfred reprime uso imprudente do /tts
bot.on("message", msg => {
    if(msg.tts && msg.content.length > 160) {
        msg.reply("por favor, pare de incomodar os outros usuários.")
    }
    
})

////////////////////////////////////// COMANDOS ALFRED /////////////////////////////////////////
// Ajuda
bot.on("message", msg => {
    let lowmsg = msg.content.toLowerCase();
    
    if(lowmsg == "!a.help")
    showHelp(msg); 
})


// Petiscos
bot.on("message", msg => {
    let lowmsg = msg.content.toLowerCase();
    let lowmsgArr = lowmsg.split(" ");
    
    let normsg = msg.content;
    let normsgArr = normsg.split(" ");
    
    if(lowmsgArr[0] == "!a.cardapio") {
        showMenu(msg);
    }
    
    if(lowmsgArr[0] == "!a.pedir") {
        let missing = true;
        for(i = 0; i < menu.length; i++) {      // procura no cardápio
            if(lowmsgArr[1] == menu[i].toLowerCase()) {     // achou
                missing = false;
                msg.reply("aqui está seu/sua *" + menu[i] + "*   " + menuEmoji[i])
            }
        }
        if(missing && normsgArr[1] != undefined) {
            msg.reply(`desculpa, mas _${normsgArr[1]}_ está em falta no momento. Tratarei de providenciar isso para você.`)
        } else if (normsgArr[1] == undefined){
            msg.reply("preciso saber o que você quer pedir. Use o comando adequadamente:"
            + "```!a.pedir   <ITEM_DO_CARDÁPIO>```"
            + "\nou posso te mostrar o cardápio de quiser:"
            + "```!a.cardapio```")
        }
    }
})

// Descrição dos Membros
bot.on("message", msg => {
    
    // retorna o id - de quem é mencionado na mensagem
    let mentionsUsernames = msg.mentions.users.map((user) => {
        return user.username
    })
    
    // retorna o id - de quem é mencionado na mensagem
    let mentions = msg.mentions.users.map((user) => {
        return user.id
    })
    
    // strings para fazer comparações
    let lowmsg = msg.content.toLowerCase();
    let lowmsgArr = lowmsg.split(" ");
    
    // strings para visualização
    let normsg = msg.content;
    let normsgArr = normsg.split(" ");
    
    // mostrar descrição do primeiro mencionado
    if(lowmsgArr[0] == "!a.desc") {
        // checar se já existe no firebase
        
        db.collection("descricoes").get().then(snapshot => {        // me devolve um snapshot da coleção inteira
            let onList = false;
            var mentions = msg.mentions.users.map((user) => {
                return user.id
            })
            
            let mentionsUsernames = msg.mentions.users.map((user) => {
                return user.username
            })
            snapshot.docs.forEach(doc => {              // percorre por cada documento da coleção
                
                if(mentions[0] == doc.id) {     
                    // mostrar a descrição do membro
                    showDescription(mentions[0], msg, mentionsUsernames[0])         
                    onList = true;                      // caso o doc já esteja na lista
                }
            })
            
            if(!onList){
                try{
                    db.collection("descricoes").doc(mentions[0]).set(newMemberDescription())  // adiciona um novo doc no firebase
                    msg.channel.send(`A descrição de ${mentionsUsernames[0]} foi criada com sucesso! \nPara editá-la use o comando: \n` + "```!a.edit.<CAMPO_A_SER_EDITADO>   @<NOME_DO_USUÁRIO>   <DESCRIÇÃO>```");
                    showDescription(mentions[0], msg, mentionsUsernames[0]);
                } catch(err) {
                    msg.reply("infelizmente, alguns bots são anti-sociais e não podem ser descritos...")    // caso FirestoreError: não adiciona (pode ser o desgraçado de um bot)
                }
            }
        })
    }
    
    // editar o primeiro mencionado
    if(lowmsgArr[0].startsWith("!a.edit")) {
        if((msg.author.id == mentions[0])) {         // um usuário não pode editar suas próprias informações
            msg.reply("você não pode editar isso.")
        } else {
            // editar
            for(i = 0; i < descsIds.length; i++) {     // descobrir qual compo é para ser editado
                
                if(("!a.edit." + descsIds[i]) == lowmsgArr[0]) {
                    
                    normsgArr.shift()      // remove o inicio do array
                    normsgArr.splice(normsgArr.indexOf("<@!" + mentions[0]) + ">", 1)     // remove a menção
                    normsgArr = normsgArr.join(" ")       // junta todo o resto!
                    
                    if(normsgArr.length > 0 && mentions[0] != undefined){
                        if(descsIds[i] == "nome"){
                            db.collection("descricoes").doc(mentions[0]).update({ "nome" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: \n" +  "```!a.desc   @<NOME_DO_USUÁRIO>```")})
                        }
                        if(descsIds[i] == "apelido"){
                            db.collection("descricoes").doc(mentions[0]).update({ "apelido" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "titulo"){
                            db.collection("descricoes").doc(mentions[0]).update({ "titulo" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "idade"){
                            db.collection("descricoes").doc(mentions[0]).update({ "idade" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "niver"){
                            db.collection("descricoes").doc(mentions[0]).update({ "niver" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "gosto"){
                            db.collection("descricoes").doc(mentions[0]).update({ "gosto" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "frase"){
                            db.collection("descricoes").doc(mentions[0]).update({ "frase" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "profissao"){
                            db.collection("descricoes").doc(mentions[0]).update({ "profissao" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "hobby"){
                            db.collection("descricoes").doc(mentions[0]).update({ "hobby" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "musica"){
                            db.collection("descricoes").doc(mentions[0]).update({ "musica" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "meme"){
                            db.collection("descricoes").doc(mentions[0]).update({ "meme" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "idolo"){
                            db.collection("descricoes").doc(mentions[0]).update({ "idolo" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "famoso"){
                            db.collection("descricoes").doc(mentions[0]).update({ "famoso" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        if(descsIds[i] == "lolchamp"){
                            db.collection("descricoes").doc(mentions[0]).update({ "lolchamp" : normsgArr}).catch(err => {msg.reply("provavelmente a descrição de <@!" + mentions[0] + "> não existe ainda. Você pode criá-la com o comando: !a.desc @<nome da pessoa>")})
                        }
                        }
                        
                        if(mentions[0] != undefined)
                        showDescription(mentions[0], msg, mentionsUsernames[0])
                        
                        return;
                }
            }
            
        }
    }
})


bot.login(token)

