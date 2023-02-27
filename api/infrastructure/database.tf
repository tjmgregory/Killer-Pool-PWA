resource "random_password" "database" {
  length  = 16
  special = false
}

resource "google_sql_user" "db-user" {
  name     = "${local.name}"
  instance = data.terraform_remote_state.shared.outputs.pgsql-db-name
  password = random_password.database.result
}

resource "google_sql_database" "db" {
  name     = "${local.name}"
  instance = data.terraform_remote_state.shared.outputs.pgsql-db-name
}
