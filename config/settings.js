module.exports = {
    RAYGUN_APIKEY: process.env.RAYGUN_APIKEY || 'abJghOcMxmYPn/qxeXG6lw==',
    MONGODB_URI: process.env.MONGOHQ_URL ||process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017/Biradix',
    SENDGRID_USERNAME : process.env.SENDGRID_USERNAME || 'app36507393@heroku.com',
    SENDGRID_PASSWORD : process.env.SENDGRID_PASSWORD || 'vnlgjsnu0908',
    MODE : process.env.mode || 'production',
    PORT : process.env.PORT || 2000,
    SECRET : process.env.secret || 'test',
    API_PATH : process.env.apipath || '/api/1.0/',
    NEW_RELIC_LICENSE_KEY : process.env.NEW_RELIC_LICENSE_KEY || '71d799aa1dc64627ec44bbc97103b81fa1e68a7c',
    NEW_RELIC_NAME : process.env.NEW_RELIC_NAME || 'Localhost',
    REDIS_URL : process.env.REDIS_URL || 'redis://h:pf6q4cqj9942d78kbbk0gtdie32@ec2-54-83-9-36.compute-1.amazonaws.com:18649',
    EXCEL_URL : process.env.EXCEL_URL || 'http://localhost:12008/excel',
    CLOUDAMQP_URL : process.env.CLOUDAMQP_URL || 'amqp://qntsinqa:64eqOU3x2xM2149WQ93jyplCpGk5CL8X@moose.rmq.cloudamqp.com/qntsinqa',
    DASHBOARD_QUEUE : "jobs.property.dashboard",
    PROFILE_QUEUE : "jobs.property.profile",
    PDF_PROFILE_QUEUE : "jobs.property.profile.pdf",
    PDF_REPORTING_QUEUE : "jobs.reporting.pdf",
    WEB_STATUS_QUEUE : "jobs.status.web",
    PHANTOM_STATUS_QUEUE : "jobs.status.phantom",
    IMPORT_QUEUE : "jobs.temp.import",
    IMPORT_USERS_QUEUE : "jobs.temp.importUsers",
    RUN_PHANTOM : process.env.RUN_PHANTOM || "web",
    RUN_DASHBOARD : process.env.RUN_DASHBOARD || "web",
    HEROKU_API_KEY : process.env.HEROKU_API_KEY,
    HEROKU_APP : process.env.HEROKU_APP || "birdaixplatform-dev",
    PDF_HIT_COUNT: 0,
    PDF_HIT_RESTART: process.env.PDF_HIT_RESTART || 2,
    PDF_WORKERS: process.env.PDF_WORKERS || 3,
    SEED_DEMO : process.env.SEED_DEMO == "1" || false
    //SKIPRABBIT : true

}