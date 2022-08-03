#[macro_use]
extern crate rocket;

use rustypi::hacker_json;

use rocket::{fs::FileServer};
use rocket_dyn_templates::{Template,context};
use serde_json::Value;


#[get("/")]
fn index() -> Template {
    let context = match hacker_json() {
        Ok(hacker_json) => hacker_json,
        Err(e) => {
            error!("{}", e);
            Value::Null
        }
    };

    Template::render("index", context! {name: context})
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![index])
        .mount("/static", FileServer::from("static/"))
        .attach(Template::fairing())
}