const puppeteer = require('puppeteer')
const Telegram = require('telegraf/telegram')
const dial_page =  "https://apex.cct.rpi.edu/apex/f?p=244:8:5938448519467::NO:::";
const botid = process.env.BOT_TOKEN || process.argv[4]
const userid = process.env.USERID || process.argv[5]
const username = process.env.RPI_USERNAME || process.argv[2]
const password = process.env.RPI_PASSWORD || process.argv[3]
if (!(username && password)) {
    console.info("Usage: npm start <username> <password> [botid] [userid]")
    process.exit(1)
}
let telegram = null
if (userid && botid) {
    telegram = new Telegram(botid, {
        webhookReply: false
    })
} else {
    console.info("No telegram info provided, screenshot will be generate at current directory.")
}

const current_date = new Date()

const main = async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 1080
  })

  await page.goto(dial_page, {waitUntil: 'networkidle2'});
  const curr = page.url()
  if (curr.includes('cas')) {
    await page.type('#username', username);
    await page.type('#password', password);

    // Submit form
    await page.click('.btn-submit');
    await page.waitFor(5000)
  }

  await page.goto(dial_page, {waitUntil: 'networkidle2'});
  const xbt = await page.$('.a-TreeView-label')
  await xbt.click()
  await page.waitFor(5000)
  const checkin_frame = page.frames()[1]
  await checkin_frame.click('input[value="None"]')
  await checkin_frame.click('.t-Button')
  await page.waitFor(5000)

  if (telegram) {
    const pics = await page.screenshot()
    telegram.sendPhoto(userid, {
        source: pics 
      }, {
        caption: `${current_date.toTimeString()} attmepts to check in.`
    })
  } else {
    await page.screenshot({
        path: `${current_date.toTimeString()}.png`
    })
  }
 

  await browser.close();
}

main().catch(e => {
    const msg = `${current_date.toTimeString()} An error occur when tried to checkin. ${e}`
    console.error(msg)
    if (telegram)
        telegram.sendMessage(userid, msg)
    
    process.exit(1)
}).then(() => {
    console.info("Success!")
})