import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/quiet-valley',timeout:120000,expect:{timeout:20000},fullyParallel:false,workers:1,retries:0,forbidOnly:!!process.env.CI,
 reporter:[['list']],outputDir:'../quiet-valley/reports/browser',
 use:{baseURL:'http://127.0.0.1:4188',trace:'retain-on-failure',screenshot:'only-on-failure'},
 webServer:{command:'node ../quiet-valley/scripts/serve.mjs',url:'http://127.0.0.1:4188/games/quiet-valley/',reuseExistingServer:false,timeout:15000},
 projects:[
 {name:'farm-chromium-desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900},launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}}},
 {name:'farm-webkit-mobile',use:{...devices['iPhone 14'],viewport:{width:390,height:844}}}
 ]
});
