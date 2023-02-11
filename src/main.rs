#[tokio::main]
pub async fn main() -> anyhow::Result<()> {
    let result = reqwest::get(
        "https://raw.githubusercontent.com/googleapis/nodejs-firestore/main/types/firestore.d.ts",
    )
    .await?
    .text()
    .await?;
    let text_info = deno_ast::SourceTextInfo::new(result.into());
    let parsed_source = deno_ast::parse_module(deno_ast::ParseParams {
        specifier: "file:///my_file.ts".to_string(),
        media_type: deno_ast::MediaType::TypeScript,
        text_info,
        capture_tokens: true,
        maybe_syntax: None,
        scope_analysis: false,
    })?;

    let first_module_item = parsed_source
        .module()
        .body
        .first()
        .ok_or(Error::NotFoundModule)?;

    let first_module_body = first_module_item
        .clone()
        .expect_stmt()
        .expect_decl()
        .expect_ts_module()
        .body
        .ok_or(Error::FirstModuleBodyNotFound)?;

    let first_module_block = first_module_body
        .as_ts_module_block()
        .ok_or(Error::FirstModuleBodyNotFound)?;

    println!("{}", first_module_block.body.len());

    Ok(())
}

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("module not found")]
    NotFoundModule,

    #[error("first module body not found")]
    FirstModuleBodyNotFound,
}
