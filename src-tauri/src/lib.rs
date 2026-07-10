mod ai;
mod commands;
mod db;
mod error;
mod state;
pub mod types;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::connection::test_connection,
            commands::connection::connect,
            commands::connection::disconnect,
            commands::connection::get_connection_status,
            commands::query::execute_query,
            commands::schema::get_schemas,
            commands::schema::get_foreign_keys,
            commands::schema::get_table_detail,
            commands::export::export_csv,
            commands::ai::generate_sql,
            commands::settings::save_settings,
            commands::settings::load_settings,
            commands::query_history::save_query_history,
            commands::query_history::load_query_history,
            commands::connections::save_connection,
            commands::connections::load_connections,
            commands::connections::delete_connection,
            commands::connections::set_default_connection,
            commands::connections::get_connection_password,
            commands::connections::get_default_connection,
            commands::table_data::get_table_data,
            commands::table_data::get_table_row_count,
            commands::table_data::insert_rows,
            commands::table_data::update_rows,
            commands::table_data::delete_rows,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::types::*;
    use ts_rs::{Config, TS};

    #[test]
    fn export_bindings() {
        // ts-rs v12 requires an explicit Config passed to `export_all`.
        // Read it from env vars (e.g. TS_RS_EXPORT_DIR) with defaults otherwise.
        let cfg = Config::from_env();

        // Connection types
        ConnectionConfig::export_all(&cfg).unwrap();
        SslMode::export_all(&cfg).unwrap();
        SavedConnection::export_all(&cfg).unwrap();
        SaveConnectionInput::export_all(&cfg).unwrap();

        // Query types
        ColumnMetadata::export_all(&cfg).unwrap();
        QueryResult::export_all(&cfg).unwrap();
        QueryHistoryItem::export_all(&cfg).unwrap();

        // Schema types
        ColumnInfo::export_all(&cfg).unwrap();
        TableInfo::export_all(&cfg).unwrap();
        SchemaInfo::export_all(&cfg).unwrap();
        ForeignKeyInfo::export_all(&cfg).unwrap();
        IndexInfo::export_all(&cfg).unwrap();
        ConstraintInfo::export_all(&cfg).unwrap();
        TableDetailInfo::export_all(&cfg).unwrap();

        // Table data types
        TableDataRequest::export_all(&cfg).unwrap();
        TableColumnInfo::export_all(&cfg).unwrap();
        TableRow::export_all(&cfg).unwrap();
        TableData::export_all(&cfg).unwrap();
        RowUpdate::export_all(&cfg).unwrap();
        RowInsert::export_all(&cfg).unwrap();
        RowDelete::export_all(&cfg).unwrap();

        // AI types
        AiProvider::export_all(&cfg).unwrap();
        GenerateSqlRequest::export_all(&cfg).unwrap();
    }
}
