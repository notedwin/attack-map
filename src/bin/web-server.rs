#[macro_use]
extern crate rocket;

use rustypi::{hacker_json};

use rocket::fs::FileServer;
use rocket_dyn_templates::Template;
use serde::Serialize;
use serde_json::Value;

// message to be displayed on the index page
#[derive(Serialize)]
struct IndexPage {
    name: Value,
}


#[get("/")]
async fn index() -> Template {
    let context = IndexPage {
        name: hacker_json().unwrap(),
    };
    Template::render("index", &context)
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![index])
        .mount("/static", FileServer::from("static/"))
        .attach(Template::fairing())
}